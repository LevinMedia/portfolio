-- Bespoke "Index" page per password-access entry (optional, off by default).
-- Apply in Supabase SQL Editor. Safe to re-run.

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS index_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS index_title TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS index_content TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS index_logo_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS index_header_title TEXT;
