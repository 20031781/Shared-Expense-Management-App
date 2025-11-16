-- ============================================================================
-- MIGRATION 003 - Role management + member split percentage
-- ============================================================================

-- Add application level admin flag if missing
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Ensure every existing user has a deterministic value
UPDATE users
SET is_admin = COALESCE(is_admin, false);

-- Track split percentages directly on list_members
ALTER TABLE list_members
    ADD COLUMN IF NOT EXISTS split_percentage numeric(5,2) NOT NULL DEFAULT 0;

-- Normalize any null percentages that might exist
UPDATE list_members
SET split_percentage = 0
WHERE split_percentage IS NULL;
