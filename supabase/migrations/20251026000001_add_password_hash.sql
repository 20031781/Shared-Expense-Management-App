/*
  # Add password authentication support

  1. Changes
    - Add `password_hash` column to `users` table
    - Make `google_id` nullable (users can register with email OR Google)
    - Add index on email for faster lookups

  2. Security
    - Password hash stored using BCrypt
    - Existing RLS policies remain unchanged
*/

-- Add password_hash column (nullable for Google-only users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Make google_id nullable (was required before, now optional)
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Add index on email for faster authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
