-- Add access_role to admin_users for admin vs private (featured works) access.
-- Run this once on existing databases. New installs get the column from prod_functions.sql.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS access_role TEXT NOT NULL DEFAULT 'admin';

-- Ensure existing row(s) are admin; new rows can be 'private'
UPDATE admin_users SET access_role = 'admin' WHERE access_role IS NULL OR access_role = '';

-- Optional: constrain values (skip if you prefer app-level only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_users_access_role_check'
  ) THEN
    ALTER TABLE admin_users
      ADD CONSTRAINT admin_users_access_role_check
      CHECK (access_role IN ('admin', 'private'));
  END IF;
END $$;
