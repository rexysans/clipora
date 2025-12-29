import { Router } from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

import { upload } from "../middleware/upload.js";

const router = Router();

// Get all videos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, status, created_at FROM videos ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get single video by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, title, description, status, created_at FROM videos WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

router.post("/upload", upload.single("video"), async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);

  try {
    const data = req.body;
    const title = data.title;
    
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
      text: "INSERT INTO videos (id,title,description,status,input_path) VALUES ($1,$2,$3,$4,$5)",
      values: [id, title, description, status, input_path],
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
