-- Add status column to oauth_connections table if it doesn't exist
ALTER TABLE oauth_connections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; 