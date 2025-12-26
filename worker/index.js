import pkg from "pg";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const { Pool } = pkg;

const pool = new Pool({
  user: "stream_app",
  host: "127.0.0.1",
  database: "stream_platform",
  password: "streampass",
  port: 5432,
});

async function createMasterPlaylist(id) {
  const content = `#EXTM3U

#EXT-X-STREAM-INF:BANDWIDTH=1000000,AVERAGE-BANDWIDTH=900000,RESOLUTION=640x360,CODECS="avc1.42e01e,mp4a.40.2"
360/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2000000,AVERAGE-BANDWIDTH=1800000,RESOLUTION=854x480,CODECS="avc1.4d401f,mp4a.40.2"
480/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=4000000,AVERAGE-BANDWIDTH=3500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720/index.m3u8
`;

  const masterPath = path.join(
    process.cwd(),
    "videos",
    "hls",
    id.toString(),
    "master.m3u8"
  );

  try {
    // Ensure the parent directory exists
    fs.mkdirSync(path.dirname(masterPath), { recursive: true });
    fs.writeFileSync(masterPath, content);
    console.log(`[SUCCESS] Master playlist created: ${masterPath}`);
  } catch (err) {
    console.error(`[ERROR] Failed to write master.m3u8: ${err.message}`);
  }
}

async function runFFMPEG(input_path, id) {
  const baseDir = path.join(process.cwd(), "videos", "hls", id.toString());
  fs.mkdirSync(baseDir, { recursive: true });

  const renditions = [
    { name: "360", width: 640, height: 360, bitrate: "1000k" },
    { name: "480", width: 854, height: 480, bitrate: "2000k" },
    { name: "720", width: 1280, height: 720, bitrate: "4000k" },
  ];

  try {
    const tasks = renditions.map((r) => {
      return new Promise((res, rej) => {
        const outDir = path.join(baseDir, r.name);
        fs.mkdirSync(outDir, { recursive: true });

        const ffmpeg = spawn("ffmpeg", [
          "-i",
          input_path,
          "-vf",
          `scale=${r.width}:${r.height}`,
          "-c:v",
          "h264",
          "-b:v",
          r.bitrate,
          "-c:a",
          "aac",
          "-hls_time",
          "6",
          "-hls_playlist_type",
          "vod",
          path.join(outDir, "index.m3u8"),
        ]);

        // Capture errors for debugging
        ffmpeg.stderr.on("data", (data) => {
          // console.log(`FFmpeg [${r.name}]: ${data}`);
        });

        ffmpeg.on("close", (code) => {
          if (code === 0) res();
          else rej(new Error(`FFmpeg ${r.name} exited with code ${code}`));
        });

        ffmpeg.on("error", rej);
      });
    });

    await Promise.all(tasks);
    return 0; // Success
  } catch (err) {
    console.error(`[FFMPEG ERROR]: ${err.message}`);
    return 1; // Failure
  }
}

async function getInputPath(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT input_path FROM videos WHERE id = $1;`,
      [id]
    );
    return result.rows[0]?.input_path;
  } catch (err) {
    console.error("DB Error in getInputPath:", err);
  } finally {
    client.release();
  }
}

async function runWorker() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
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
    return result.rows[0]?.id;
  } catch (err) {
    console.error("Worker Query Error:", err);
  } finally {
    client.release();
  }
}

async function detectAbandonedJobs() {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE videos
      SET status = 'uploaded', claimed_at = NULL
      WHERE id IN (
        SELECT id FROM videos
        WHERE status = 'processing'
        AND claimed_at IS NOT NULL
        AND NOW() - claimed_at > INTERVAL '5 minutes'
      );
    `);
  } finally {
    client.release();
  }
}

async function finalizeJob(jobID, exitCode) {
  const client = await pool.connect();
  try {
    if (exitCode === 0) {
      await client.query(
        `UPDATE videos SET status = 'ready', hls_path = $2, claimed_at = NULL WHERE id = $1`,
        [jobID, `videos/hls/${jobID}`]
      );
      console.log(`Video ${jobID} marked READY`);
    } else {
      const result = await client.query(
        `UPDATE videos 
         SET retry_count = retry_count + 1,
             status = CASE WHEN retry_count + 1 >= 3 THEN 'failed' ELSE 'uploaded' END,
             claimed_at = NULL,
             last_error = $2
         WHERE id = $1 RETURNING status, retry_count;`,
        [jobID, `FFmpeg failed with code ${exitCode}`]
      );
      console.log(`Job ${jobID} failed. Status: ${result.rows[0].status}`);
    }
  } catch (err) {
    console.error("Finalize Error:", err);
  } finally {
    client.release();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Worker started...");
  while (true) {
    try {
      await detectAbandonedJobs();
      const jobID = await runWorker();

      if (!jobID) {
        await sleep(5000);
        continue;
      }

      console.log(`Processing job: ${jobID}`);
      const inputPath = await getInputPath(jobID);

      if (!inputPath) {
        console.error(`No input path for job ${jobID}`);
        await finalizeJob(jobID, 1);
        continue;
      }

      const exitCode = await runFFMPEG(inputPath, jobID);

      if (exitCode === 0) {
        await createMasterPlaylist(jobID);
      }

      await finalizeJob(jobID, exitCode);
    } catch (err) {
      console.error("Main Loop Crash Recovery:", err);
      await sleep(5000);
    }
  }
}

main().catch(console.error);
