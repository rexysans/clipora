import { Router } from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

import { upload } from "../middleware/upload.js";
import { STORAGE } from "../config/storage.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Get all videos with uploader info
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.title, 
        v.description, 
        v.status, 
        v.created_at, 
        v.views, 
        v.thumbnail_path,
        u.id as uploader_id,
        u.name as uploader_name,
        u.avatar_url as uploader_avatar
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      ORDER BY v.created_at DESC
    `);
    
    const videos = result.rows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      status: v.status,
      created_at: v.created_at,
      views: v.views || 0,
      thumbnailUrl: v.thumbnail_path
        ? `http://localhost:8080/thumbs/${v.thumbnail_path}`
        : null,
      uploader: v.uploader_id ? {
        id: v.uploader_id,
        name: v.uploader_name,
        avatar: v.uploader_avatar,
      } : null,
    }));
    
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get single video by ID with uploader info
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.title, 
        v.description, 
        v.status, 
        v.created_at, 
        v.hls_key, 
        v.views, 
        v.thumbnail_path,
        u.id as uploader_id,
        u.name as uploader_name,
        u.avatar_url as uploader_avatar
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const video = result.rows[0];

    const playbackUrl =
      video.hls_key && video.status === "ready"
        ? `${STORAGE.MEDIA_BASE_URL}/${video.hls_key}`
        : null;

    const thumbnailUrl = video.thumbnail_path
      ? `http://localhost:8080/thumbs/${video.thumbnail_path}`
      : null;

    res.json({
      id: video.id,
      title: video.title,
      description: video.description,
      status: video.status,
      created_at: video.created_at,
      playbackUrl,
      views: video.views || 0,
      thumbnailUrl,
      uploader: video.uploader_id ? {
        id: video.uploader_id,
        name: video.uploader_name,
        avatar: video.uploader_avatar,
      } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// Track video view (protected by auth)
router.post("/:id/view", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const videoId = req.params.id;

  try {
    // Check if user already viewed this video
    const exists = await pool.query(
      "SELECT 1 FROM video_views WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );

    // If already viewed, do nothing
    if (exists.rowCount > 0) {
      return res.sendStatus(204); // No Content - already counted
    }

    // Check if video exists
    const videoExists = await pool.query(
      "SELECT 1 FROM videos WHERE id = $1",
      [videoId]
    );

    if (videoExists.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Begin transaction for atomic operation
    await pool.query("BEGIN");

    // Record the view
    await pool.query(
      "INSERT INTO video_views (user_id, video_id) VALUES ($1, $2)",
      [userId, videoId]
    );

    // Increment view count
    await pool.query(
      "UPDATE videos SET views = views + 1 WHERE id = $1",
      [videoId]
    );

    await pool.query("COMMIT");

    res.sendStatus(201); // Created
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error tracking view:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
});

// Upload video - requires authentication
router.post("/upload", requireAuth, upload.single("video"), async (req, res) => {
  try {
    const data = req.body;
    const title = data.title;
    const uploaderId = req.user.id; // Get user ID from auth middleware

    if (!req.file) {
      return res.status(400).json({ error: "Video file is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    const filePath = req.file.path;
    const id = uuidv4();
    const description = data.description || null;
    const status = "uploaded";
    const input_path = filePath;
    
    const query = {
      text: "INSERT INTO videos (id,title,description,status,input_path,uploader_id) VALUES ($1,$2,$3,$4,$5,$6)",
      values: [id, title, description, status, input_path, uploaderId],
    };

    await pool.query(query);
    res.status(201).json({
      id,
      status: "uploaded",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Upload failed",
    });
  }
});

export default router;