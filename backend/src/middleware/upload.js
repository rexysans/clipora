import multer from "multer";
import path from "path";

// Storage for video uploads
const videoStorage = multer.diskStorage({
destination: process.env.UPLOAD_DIR || "backend/uploads/raw",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Storage for thumbnail uploads
const thumbnailStorage = multer.diskStorage({
destination: process.env.THUMB_DIR || "videos/thumbs",
  filename: (req, file, cb) => {
    // Generate versioned filename: videoId_timestamp.ext
    const videoId = req.params.id || req.body.videoId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${videoId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for thumbnails"));
  }
};

export const upload = multer({ storage: videoStorage });
export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});