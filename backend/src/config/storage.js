// backend/src/config/storage.js
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

export const STORAGE = {
  // Media URLs
  MEDIA_BASE_URL: isProduction 
    ? process.env.STORAGE_BASE_URL || "https://media.clipora.in"
    : "http://localhost:8080",
  
  // Storage directories
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), "backend", "uploads", "raw"),
  HLS_DIR: process.env.HLS_DIR || path.join(process.cwd(), "videos", "hls"),
  THUMBS_DIR: process.env.THUMB_DIR || path.join(process.cwd(), "videos", "thumbs"),
  AVATAR_DIR: process.env.AVATAR_DIR || path.join(process.cwd(), "videos", "avatars"),
};
