-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================
-- VIDEOS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT,

    -- Upload & processing state
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),

    input_path TEXT NOT NULL,              -- raw uploaded file path
    hls_key TEXT,                           -- hls/<id>/master.m3u8
    thumbnail_path TEXT,                   -- stored filename only

    -- Relations
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Counters
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- Processing
    processing_progress INTEGER DEFAULT 0 CHECK (processing_progress BETWEEN 0 AND 100),
    claimed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_videos_status_created
    ON videos (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_uploader
    ON videos (uploader_id);

CREATE INDEX IF NOT EXISTS idx_videos_status_ready
    ON videos (status)
    WHERE status = 'ready';

-- ===============================
-- AUTO-UPDATE updated_at
-- ===============================
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_videos_updated_at ON videos;

CREATE TRIGGER trigger_update_videos_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_videos_updated_at();
