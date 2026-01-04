-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- Add follower_count to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add custom follower name to users table (what they want to call their followers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_name VARCHAR(50) DEFAULT 'Followers';

-- Update follower counts for existing users
UPDATE users SET follower_count = (
  SELECT COUNT(*) FROM followers WHERE following_id = users.id
);

UPDATE users SET following_count = (
  SELECT COUNT(*) FROM followers WHERE follower_id = users.id
);
