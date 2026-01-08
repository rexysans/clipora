-- Performance Indexes for Stream Platform
-- Run this to dramatically improve query performance

-- Videos table indexes
CREATE INDEX IF NOT EXISTS idx_videos_status_created ON videos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_uploader ON videos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_videos_status_ready ON videos(status) WHERE status = 'ready';

-- Video views indexes
CREATE INDEX IF NOT EXISTS idx_video_views_user ON video_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);

-- Video reactions indexes
CREATE INDEX IF NOT EXISTS idx_video_reactions_user ON video_reactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_reactions_video ON video_reactions(video_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Followers indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id, created_at DESC);

-- Watch later indexes
CREATE INDEX IF NOT EXISTS idx_watch_later_user ON watch_later(user_id, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_later_video ON watch_later(video_id);

-- Users table index
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE videos;
ANALYZE video_views;
ANALYZE video_reactions;
ANALYZE comments;
ANALYZE followers;
ANALYZE watch_later;
ANALYZE users;
