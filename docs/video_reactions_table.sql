-- Video reactions table for likes/dislikes
CREATE TABLE IF NOT EXISTS video_reactions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT now(),
  
  PRIMARY KEY (user_id, video_id)
);

-- Add like and dislike counts to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_reactions_video_id ON video_reactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_user_id ON video_reactions(user_id);