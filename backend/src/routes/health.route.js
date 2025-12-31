import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

router.get("/videos", async (req, res) => {
  const result = await pool.query(`
    SELECT id, title, status, created_at, thumbnail_path
    FROM videos
    WHERE status = 'ready'
    ORDER BY created_at DESC
  `);

  res.json(
    result.rows.map((v) => ({
      id: v.id,
      title: v.title,
      status: v.status,
      created_at: v.created_at,
      thumbnailUrl: v.thumbnail_path
        ? `http://localhost:8080/thumbs/${v.thumbnail_path}`
        : `http://localhost:8080/thumbs/default.jpg`,
    }))
  );
});


export default router;
