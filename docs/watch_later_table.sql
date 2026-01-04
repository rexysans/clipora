-- Watch Later table for saving videos to watch later
CREATE TABLE IF NOT EXISTS watch_later (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT now(),
  
  PRIMARY KEY (user_id, video_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON watch_later(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_video_id ON watch_later(video_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_added_at ON watch_later(added_at);
