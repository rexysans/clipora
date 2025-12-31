import pkg from "pg";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const { Pool } = pkg;

/* ===============================
   DATABASE
================================ */
const pool = new Pool({
  user: "stream_app",
  host: "127.0.0.1",
  database: "stream_platform",
  password: "streampass",
  port: 5432,
});

/* ===============================
   UTILS
================================ */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(level, msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

/* ===============================
   THUMBNAIL
================================ */
async function generateThumbnail(inputPath, id) {
  const dir = path.join(process.cwd(), "videos", "thumbs");
  fs.mkdirSync(dir, { recursive: true });

  const out = path.join(dir, `${id}.jpg`);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-ss",
      "00:00:03",
      "-vframes",
      "1",
      "-q:v",
      "2",
      out,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        log("THUMB", `Thumbnail created for ${id}`);
        resolve(`${id}.jpg`);
      } else {
        reject(new Error("Thumbnail FFmpeg failed"));
      }
    });

    ffmpeg.on("error", reject);
  });
}

/* ===============================
   MASTER PLAYLIST
================================ */
async function createMasterPlaylist(id) {
  const content = `#EXTM3U

#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360
360/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=854x480
480/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1280x720
720/index.m3u8
`;

  const out = path.join(process.cwd(), "videos", "hls", id, "master.m3u8");

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);

  log("HLS", `Master playlist written for ${id}`);
}

/* ===============================
   HLS TRANSCODING
================================ */
async function runFFMPEG(inputPath, id) {
  const base = path.join(process.cwd(), "videos", "hls", id);
  fs.mkdirSync(base, { recursive: true });

  const renditions = [
    { n: "360", w: 640, h: 360, b: "1000k" },
    { n: "480", w: 854, h: 480, b: "2000k" },
    { n: "720", w: 1280, h: 720, b: "4000k" },
  ];

  try {
    await Promise.all(
      renditions.map((r) => {
        return new Promise((resolve, reject) => {
          const dir = path.join(base, r.n);
          fs.mkdirSync(dir, { recursive: true });

          const ff = spawn("ffmpeg", [
            "-y",
            "-i",
            inputPath,
            "-vf",
            `scale=${r.w}:${r.h}`,
            "-c:v",
            "h264",
            "-b:v",
            r.b,
            "-c:a",
            "aac",
            "-hls_time",
            "6",
            "-hls_playlist_type",
            "vod",
            path.join(dir, "index.m3u8"),
          ]);

          ff.on("close", (code) =>
            code === 0 ? resolve() : reject(new Error("FFmpeg failed"))
          );

          ff.on("error", reject);
        });
      })
    );

    return 0;
  } catch (err) {
    log("ERROR", `FFmpeg failed for ${id}`);
    return 1;
  }
}

/* ===============================
   DB HELPERS
================================ */
async function claimJob() {
  const c = await pool.connect();
  try {
    const r = await c.query(`
      UPDATE videos
      SET status = 'processing', claimed_at = NOW()
      WHERE id = (
        SELECT id FROM videos
        WHERE status = 'uploaded'
        ORDER BY created_at
        LIMIT 1
      )
      RETURNING id;
    `);
    return r.rows[0]?.id || null;
  } finally {
    c.release();
  }
}

async function getInputPath(id) {
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT input_path FROM videos WHERE id = $1", [
      id,
    ]);
    return r.rows[0]?.input_path || null;
  } finally {
    c.release();
  }
}

async function detectAbandonedJobs() {
  const c = await pool.connect();
  try {
    await c.query(`
      UPDATE videos
      SET status = 'uploaded', claimed_at = NULL
      WHERE status = 'processing'
        AND claimed_at < NOW() - INTERVAL '5 minutes';
    `);
  } finally {
    c.release();
  }
}

async function finalizeJob(id, exitCode, thumbnailPath) {
  const c = await pool.connect();
  const hlsKey = `hls/${id}/master.m3u8`;

  try {
    if (exitCode === 0) {
      await c.query(
        `UPDATE videos
         SET status = 'ready',
             hls_key = $2,
             thumbnail_path = $3,
             claimed_at = NULL
         WHERE id = $1`,
        [id, hlsKey, thumbnailPath]
      );
      log("READY", `Video ${id} is READY`);
    } else {
      await c.query(
        `UPDATE videos
         SET retry_count = retry_count + 1,
             status = CASE
               WHEN retry_count + 1 >= 3 THEN 'failed'
               ELSE 'uploaded'
             END,
             claimed_at = NULL,
             last_error = $2
         WHERE id = $1`,
        [id, "FFmpeg failed"]
      );
      log("RETRY", `Video ${id} returned to queue`);
    }
  } finally {
    c.release();
  }
}

/* ===============================
   MAIN DAEMON LOOP
================================ */
async function main() {
  log("BOOT", "Worker daemon started");

  while (true) {
    try {
      await detectAbandonedJobs();

      const jobID = await claimJob();
      if (!jobID) {
        await sleep(5000);
        continue;
      }

      log("JOB", `Processing ${jobID}`);

      const inputPath = await getInputPath(jobID);
      if (!inputPath) {
        log("ERROR", `Missing input_path for ${jobID}`);
        await finalizeJob(jobID, 1, null);
        continue;
      }

      const exitCode = await runFFMPEG(inputPath, jobID);

      let thumb = null;
      if (exitCode === 0) {
        await createMasterPlaylist(jobID);
        thumb = await generateThumbnail(inputPath, jobID);
      }

      await finalizeJob(jobID, exitCode, thumb);
    } catch (err) {
      log("CRASH", err.message);
      await sleep(5000);
    }
  }
}

main().catch((e) => log("FATAL", e.message));
