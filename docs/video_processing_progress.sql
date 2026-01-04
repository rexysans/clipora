-- Add processing progress field to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN videos.processing_progress IS 'Processing progress percentage (0-100). 0 when uploaded/failed, 100 when ready';