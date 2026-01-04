import { Router } from "express";
import pool from "../db.js";
import { STORAGE } from "../config/storage.js";

const router = Router();

// Helper function to get thumbnail URL
const getThumbnailUrl = (videoId, thumbnailPath) => {
  if (thumbnailPath) {
    const filename = thumbnailPath.split("/").pop();
    return `${STORAGE.MEDIA_BASE_URL}/thumbs/${filename}`;
  }
  
  const defaultPath = `${STORAGE.THUMBS_DIR}/${videoId}.jpg`;
  const fs = require("fs");
  if (fs.existsSync(defaultPath)) {
    return `${STORAGE.MEDIA_BASE_URL}/thumbs/${videoId}.jpg`;
  }
  
  return null;
};

// Search for videos and channels
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ videos: [], channels: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search videos
    const videosResult = await pool.query(
      `SELECT 
        v.id, 
        v.title, 
        v.description,
        v.views, 
        v.created_at,
        v.thumbnail_path,
        u.id as uploader_id,
        u.name as uploader_name,
        u.avatar_url as uploader_avatar
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      WHERE v.status = 'ready' 
        AND (v.title ILIKE $1 OR v.description ILIKE $1)
      ORDER BY v.views DESC, v.created_at DESC
      LIMIT 20`,
      [searchTerm]
    );

    // Search channels (users)
    const channelsResult = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.avatar_url,
        u.follower_count,
        u.follower_name,
        COUNT(v.id) as video_count
      FROM users u
      LEFT JOIN videos v ON u.id = v.uploader_id AND v.status = 'ready'
      WHERE u.name ILIKE $1
      GROUP BY u.id, u.name, u.avatar_url, u.follower_count, u.follower_name
      ORDER BY u.follower_count DESC
      LIMIT 10`,
      [searchTerm]
    );

    // Format video results
    const videos = videosResult.rows.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      views: video.views || 0,
      createdAt: video.created_at,
      thumbnailUrl: getThumbnailUrl(video.id, video.thumbnail_path),
      uploader: {
        id: video.uploader_id,
        name: video.uploader_name,
        avatar: video.uploader_avatar,
      },
    }));

    // Format channel results
    const channels = channelsResult.rows.map((channel) => ({
      id: channel.id,
      name: channel.name,
      avatar: channel.avatar_url,
      followerCount: channel.follower_count || 0,
      followerName: channel.follower_name || "Subscribers",
      videoCount: parseInt(channel.video_count) || 0,
    }));

    res.json({ videos, channels });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
