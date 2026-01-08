-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add constraint to ensure username is lowercase and alphanumeric with underscores only
ALTER TABLE users ADD CONSTRAINT username_format 
  CHECK (username ~* '^[a-z0-9_]{3,20}$');
