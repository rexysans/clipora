import { Router } from "express";
import path from "path";
import express from "express";

const router = Router();

// Absolute path to HLS folder
const HLS_DIR = path.resolve("videos/hls");


router.use(
  "/",
  express.static(HLS_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      }

      if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/mp2t");
      }

      // required for video players
      res.setHeader("Accept-Ranges", "bytes");
    },
  })
);

export default router;
