-- =====================================================
-- THEME SYSTEM SCHEMA
-- =====================================================
-- This script creates the database objects that power the theme
-- switching system. Run it in the Supabase SQL editor after
-- applying prod_functions.sql.
-- =====================================================

-- =====================================================
-- THEMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_theme
ON themes (is_active)
WHERE is_active = true;

-- =====================================================
-- SITE SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    active_theme_id TEXT NOT NULL REFERENCES themes(theme_id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only the service role can read/write these tables
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - themes" ON themes;
CREATE POLICY "Service role only - themes" ON themes
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role only - site_settings" ON site_settings;
CREATE POLICY "Service role only - site_settings" ON site_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Seed a placeholder record for the upcoming \"my-first-theme\"
INSERT INTO themes (theme_id, display_name, description, is_active)
VALUES ('my-first-theme', 'My First Theme', 'Current LevinMedia experience', true)
ON CONFLICT (theme_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

INSERT INTO site_settings (id, active_theme_id)
VALUES (1, 'my-first-theme')
ON CONFLICT (id) DO UPDATE
SET active_theme_id = EXCLUDED.active_theme_id,
    updated_at = NOW();

