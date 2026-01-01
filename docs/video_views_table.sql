-- Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Video views tracking table
CREATE TABLE IF NOT EXISTS video_views (
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  viewed_at TIMESTAMP DEFAULT now(),
  
  PRIMARY KEY (user_id, video_id),
  
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Add views column to videos table if it doesn't exist
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at);