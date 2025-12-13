-- =====================================================
-- PRODUCTION DATABASE SCHEMA & FUNCTIONS
-- =====================================================
-- 
-- This file contains all production database schema and functions for the LevinMedia site.
-- All functions are prefixed with 'prod_' to distinguish them from one-time fixes.
--
-- IMPORTANT: 
-- - Only add functions that are core to the site's functionality
-- - Use the 'prod_' prefix for all functions in this file
-- - Keep one-time fixes or temporary functions separate
-- - Document each function's purpose and usage
-- - This entire file can be copy-pasted into Supabase SQL Editor to update everything
--
-- =====================================================

-- =====================================================
-- CLEANUP EXISTING OBJECTS (for clean updates)
-- =====================================================

-- Drop existing functions if they exist (to handle signature changes)
DROP FUNCTION IF EXISTS prod_get_all_selected_works();
DROP FUNCTION IF EXISTS prod_get_selected_works();
DROP FUNCTION IF EXISTS prod_get_selected_work_by_slug(TEXT);
DROP FUNCTION IF EXISTS prod_upsert_selected_work(TEXT, TEXT, TEXT, TEXT, JSONB, BOOLEAN, BOOLEAN, INTEGER, UUID);
DROP FUNCTION IF EXISTS prod_get_all_field_notes();
DROP FUNCTION IF EXISTS prod_get_field_notes();
DROP FUNCTION IF EXISTS prod_get_field_note_by_slug(TEXT);
DROP FUNCTION IF EXISTS prod_upsert_field_note(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, BOOLEAN, BOOLEAN, INTEGER, UUID);
DROP FUNCTION IF EXISTS prod_delete_field_note(UUID);
DROP FUNCTION IF EXISTS prod_update_field_note_thumbnail_crop(UUID, JSONB);

-- NOTE: We DO NOT drop admin_users, setup_state, or work history tables to preserve data!
-- Tables use CREATE TABLE IF NOT EXISTS to safely handle existing data

-- NOTE: Indexes will be created with IF NOT EXISTS below, no need to drop them

-- =====================================================
-- ADMIN AUTHENTICATION SCHEMA
-- =====================================================

-- Admin users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Setup state tracking table
CREATE TABLE IF NOT EXISTS setup_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setup_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WORK HISTORY TABLE SCHEMA
-- =====================================================
-- 
-- This schema handles multiple positions at the same company and gaps.
-- Companies are grouped by company_name, and positions are ordered by date.
--
-- =====================================================

-- Companies table to group positions
CREATE TABLE IF NOT EXISTS work_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL UNIQUE,
    company_logo_url TEXT, -- URL to logo image in Supabase Storage media folder
    employment_type TEXT, -- 'Full-time Remote', 'Full-time On-site', 'Full-time Hybrid', 'Contract', etc.
    display_order INTEGER NOT NULL DEFAULT 0, -- For controlling company order in timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual positions/roles at companies
CREATE TABLE IF NOT EXISTS work_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES work_companies(id) ON DELETE CASCADE,
    
    -- Position Information  
    position_title TEXT NOT NULL,
    position_description TEXT,
    
    -- Date Information
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for current position
    
    -- Display Order within company (for multiple positions at same company)
    position_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_position_order CHECK (position_order >= 0)
);

-- =====================================================
-- HOWDY COMPONENT TABLE SCHEMA
-- JUST A SILLY GRETTING FOR THE HOME PAGE OF THE SITE
-- =====================================================

CREATE TABLE IF NOT EXISTS howdy_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Image Information (Supabase Storage URLs)
    image_src TEXT NOT NULL, -- e.g., 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/images/profile.jpg'
    image_alt TEXT NOT NULL,
    
    -- Greeting Text
    greeting TEXT NOT NULL,
    
    -- List Items (separate text fields)
    li_1 TEXT,
    li_2 TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_work_companies_display_order 
ON work_companies(display_order DESC);

CREATE INDEX IF NOT EXISTS idx_work_companies_name 
ON work_companies(company_name);

-- Position indexes
CREATE INDEX IF NOT EXISTS idx_work_positions_company_date 
ON work_positions(company_id, start_date DESC, end_date DESC);

CREATE INDEX IF NOT EXISTS idx_work_positions_dates 
ON work_positions(start_date DESC, end_date DESC);

CREATE INDEX IF NOT EXISTS idx_work_positions_order 
ON work_positions(company_id, position_order DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE howdy_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-runs)
DROP POLICY IF EXISTS "Service role only - admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role only - setup_state" ON setup_state;
DROP POLICY IF EXISTS "Service role only - work_companies" ON work_companies;
DROP POLICY IF EXISTS "Service role only - work_positions" ON work_positions;
DROP POLICY IF EXISTS "Service role only - howdy_content" ON howdy_content;

-- Create policies that only allow service role access
-- Admin Users - Service Role Only
CREATE POLICY "Service role only - admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Setup State - Service Role Only
CREATE POLICY "Service role only - setup_state" ON setup_state
    FOR ALL USING (auth.role() = 'service_role');

-- Work Companies - Service Role Only
CREATE POLICY "Service role only - work_companies" ON work_companies
    FOR ALL USING (auth.role() = 'service_role');

-- Work Positions - Service Role Only  
CREATE POLICY "Service role only - work_positions" ON work_positions
    FOR ALL USING (auth.role() = 'service_role');

-- Howdy Content - Service Role Only
CREATE POLICY "Service role only - howdy_content" ON howdy_content
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- ANALYTICS TABLES (SELF-HOSTED)
-- =====================================================

-- Pageviews table to store privacy-friendly analytics
CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    path TEXT NOT NULL,
    referrer_domain TEXT,
    utm JSONB DEFAULT '{}',
    visitor_id UUID,
    session_id UUID,
    is_bot BOOLEAN DEFAULT false,
    country TEXT,
    region TEXT,
    city TEXT,
    latitude REAL,
    longitude REAL,
    is_admin BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_time ON analytics_pageviews(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_path ON analytics_pageviews(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_country ON analytics_pageviews(country);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_time_path ON analytics_pageviews(occurred_at DESC, path);

-- Enable RLS and restrict to service role
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only - analytics_pageviews" ON analytics_pageviews;
CREATE POLICY "Service role only - analytics_pageviews" ON analytics_pageviews
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- SAMPLE DATA (for reference)
-- =====================================================
/*
-- Insert companies first
INSERT INTO work_companies (company_name, company_logo_url, employment_type, display_order) VALUES 
('TechCorp Inc.', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/techcorp_logo.png', 'Full-time Remote', 1),
('Digital Solutions LLC', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/digitalsolutions_logo.jpg', 'Full-time Hybrid', 2),
('Innovation Labs', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/innovationlabs_logo.png', 'Full-time Remote', 3),
('StartupXYZ', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/startupxyz_logo.jpg', 'Full-time On-site', 4),
('Enterprise Systems', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/enterprisesystems_logo.png', 'Full-time Hybrid', 5),
('Creative Agency', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/creativeagency_logo.jpg', 'Contract Remote', 6),
('Global Tech', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/globaltech_logo.png', 'Full-time On-site', 7);

-- Then insert positions (using company IDs from above)
INSERT INTO work_positions (company_id, position_title, position_description, start_date, end_date, position_order) VALUES 
-- TechCorp Inc. positions (multiple positions example)
((SELECT id FROM work_companies WHERE company_name = 'TechCorp Inc.'), 'Senior Product Manager', 'Led product strategy and development for enterprise software platform.', '2023-01-01', NULL, 1),
((SELECT id FROM work_companies WHERE company_name = 'TechCorp Inc.'), 'Product Manager', 'Managed product roadmap and feature development for SaaS applications.', '2021-03-01', '2022-12-31', 2),

-- Digital Solutions LLC positions
((SELECT id FROM work_companies WHERE company_name = 'Digital Solutions LLC'), 'Lead Developer', 'Architected and developed scalable web applications using modern technologies.', '2020-06-01', '2022-11-30', 1),
((SELECT id FROM work_companies WHERE company_name = 'Digital Solutions LLC'), 'Senior Developer', 'Built full-stack applications and mentored junior developers.', '2018-09-01', '2020-05-31', 2),

-- Innovation Labs positions
((SELECT id FROM work_companies WHERE company_name = 'Innovation Labs'), 'Product Manager', 'Drove product vision and execution for innovative tech solutions.', '2019-01-01', '2021-02-28', 1),

-- StartupXYZ positions
((SELECT id FROM work_companies WHERE company_name = 'StartupXYZ'), 'Full Stack Developer', 'Developed MVP and core features for early-stage startup.', '2017-03-01', '2018-12-31', 1),

-- Enterprise Systems positions
((SELECT id FROM work_companies WHERE company_name = 'Enterprise Systems'), 'Software Engineer', 'Built enterprise-grade applications and integrations.', '2016-01-01', '2017-02-28', 1),

-- Creative Agency positions
((SELECT id FROM work_companies WHERE company_name = 'Creative Agency'), 'Frontend Developer', 'Created responsive web interfaces and interactive experiences.', '2014-06-01', '2015-11-30', 1),

-- Global Tech positions
((SELECT id FROM work_companies WHERE company_name = 'Global Tech'), 'Junior Developer', 'Contributed to web development projects and learned modern frameworks.', '2013-01-01', '2014-05-31', 1);

-- Howdy component content
INSERT INTO howdy_content (image_src, image_alt, greeting, li_1, li_2) VALUES 
('https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/images/profile.jpg', 'David Levin', 'Hi, I''m David 👋', '👷 I orchestrate software architecture & design.', '🚀 Fancy that, right? Lets make awesome happen.');
*/

-- =====================================================
-- PRODUCTION FUNCTIONS
-- =====================================================

-- Function to create default admin user
CREATE OR REPLACE FUNCTION prod_create_default_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin user already exists
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'Admin') THEN
        -- Insert default admin user with placeholder credentials
        -- Note: The actual credentials will be set by the setup API using environment variables
        -- This function is mainly for reference - use the setup API instead
        INSERT INTO admin_users (username, password_hash, email, is_active) 
        VALUES (
            'Admin', 
            '$2a$10$placeholder.hash.that.will.be.replaced.by.setup.api', -- This will be replaced by the setup API
            'admin@example.com',
            true
        );
    END IF;
END;
$$;

-- Function to authenticate admin user
CREATE OR REPLACE FUNCTION prod_authenticate_admin(
    p_username TEXT,
    p_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    username TEXT,
    email TEXT,
    is_authenticated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record admin_users%ROWTYPE;
BEGIN
    -- Get user record
    SELECT * INTO user_record 
    FROM admin_users 
    WHERE username = p_username AND is_active = true;
    
    -- Check if user exists and password matches
    -- Note: You'll need to implement proper password verification with bcrypt
    -- For now, this is a placeholder - replace with actual bcrypt verification
    IF user_record.id IS NOT NULL THEN
        -- Update last login
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE id = user_record.id;
        
        RETURN QUERY SELECT 
            user_record.id,
            user_record.username,
            user_record.email,
            true;
    ELSE
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            false;
    END IF;
END;
$$;

-- =====================================================
-- SECURE SETUP FUNCTIONS
-- =====================================================

-- Function to check if setup is completed
CREATE OR REPLACE FUNCTION prod_is_setup_completed()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM setup_state 
        WHERE setup_completed = true
    );
END;
$$;

-- Function to mark setup as completed
CREATE OR REPLACE FUNCTION prod_mark_setup_completed()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update setup state
    INSERT INTO setup_state (setup_completed, completed_at)
    VALUES (true, NOW())
    ON CONFLICT (id) DO UPDATE SET
        setup_completed = true,
        completed_at = NOW();
    
    RETURN true;
END;
$$;

-- Function to get all work companies with positions
DROP FUNCTION IF EXISTS prod_get_work_history();
CREATE OR REPLACE FUNCTION prod_get_work_history()
RETURNS TABLE(
    id UUID,
    company_name TEXT,
    company_logo_url TEXT,
    employment_type TEXT,
    display_order INTEGER,
    positions JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.company_name,
        wc.company_logo_url,
        wc.employment_type,
        wc.display_order,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', wp.id,
                    'position_title', wp.position_title,
                    'position_description', wp.position_description,
                    'start_date', wp.start_date,
                    'end_date', wp.end_date,
                    'position_order', wp.position_order
                ) ORDER BY wp.start_date DESC, wp.position_order DESC
            ) FILTER (WHERE wp.id IS NOT NULL),
            '[]'::json
        ) as positions
    FROM work_companies wc
    LEFT JOIN work_positions wp ON wc.id = wp.company_id
    GROUP BY wc.id, wc.company_name, wc.company_logo_url, wc.employment_type, wc.display_order
    ORDER BY 
        COALESCE(
            (SELECT MAX(wp2.start_date) FROM work_positions wp2 WHERE wp2.company_id = wc.id),
            '1900-01-01'::date
        ) DESC,
        wc.company_name;
END;
$$;

-- Function to add or update work company
CREATE OR REPLACE FUNCTION prod_upsert_work_company(
    p_company_name TEXT,
    p_company_logo_url TEXT DEFAULT NULL,
    p_employment_type TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT NULL,
    p_company_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
    v_auto_display_order INTEGER;
BEGIN
    -- Auto-calculate display order based on most recent position date if not provided
    IF p_display_order IS NULL THEN
        SELECT COALESCE(
            EXTRACT(EPOCH FROM MAX(wp.start_date))::INTEGER / 86400, -- Convert to days since epoch
            0
        ) INTO v_auto_display_order
        FROM work_positions wp
        WHERE wp.company_id = COALESCE(p_company_id, gen_random_uuid());
    ELSE
        v_auto_display_order := p_display_order;
    END IF;

    IF p_company_id IS NOT NULL THEN
        -- Update existing company
        UPDATE work_companies 
        SET 
            company_name = p_company_name,
            company_logo_url = p_company_logo_url,
            employment_type = p_employment_type,
            display_order = v_auto_display_order,
            updated_at = NOW()
        WHERE id = p_company_id
        RETURNING id INTO result_id;
        
        IF result_id IS NULL THEN
            RAISE EXCEPTION 'Company with ID % not found', p_company_id;
        END IF;
    ELSE
        -- Insert new company
        INSERT INTO work_companies (company_name, company_logo_url, employment_type, display_order)
        VALUES (p_company_name, p_company_logo_url, p_employment_type, v_auto_display_order)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$;

-- Function to add or update work position
CREATE OR REPLACE FUNCTION prod_upsert_work_position(
    p_company_id UUID,
    p_position_title TEXT,
    p_start_date DATE,
    p_position_description TEXT DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_position_order INTEGER DEFAULT NULL,
    p_position_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
    v_auto_position_order INTEGER;
BEGIN
    -- Auto-calculate position order based on start date if not provided
    IF p_position_order IS NULL THEN
        SELECT COALESCE(
            EXTRACT(EPOCH FROM p_start_date)::INTEGER / 86400, -- Convert to days since epoch
            0
        ) INTO v_auto_position_order;
    ELSE
        v_auto_position_order := p_position_order;
    END IF;

    IF p_position_id IS NOT NULL THEN
        -- Update existing position
        UPDATE work_positions 
        SET 
            company_id = p_company_id,
            position_title = p_position_title,
            position_description = p_position_description,
            start_date = p_start_date,
            end_date = p_end_date,
            position_order = v_auto_position_order,
            updated_at = NOW()
        WHERE id = p_position_id
        RETURNING id INTO result_id;
        
        IF result_id IS NULL THEN
            RAISE EXCEPTION 'Position with ID % not found', p_position_id;
        END IF;
    ELSE
        -- Insert new position
        INSERT INTO work_positions (company_id, position_title, position_description, start_date, end_date, position_order)
        VALUES (p_company_id, p_position_title, p_position_description, p_start_date, p_end_date, v_auto_position_order)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$;

-- Function to delete work position
CREATE OR REPLACE FUNCTION prod_delete_work_position(p_position_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM work_positions WHERE id = p_position_id;
    RETURN FOUND;
END;
$$;

-- Function to delete work company (and all its positions)
CREATE OR REPLACE FUNCTION prod_delete_work_company(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM work_companies WHERE id = p_company_id;
    RETURN FOUND;
END;
$$;

-- =====================================================
-- ADMIN SETUP INSTRUCTIONS:
-- =====================================================
--
-- 1. Deploy this schema to your Supabase database
-- 2. Visit /admin/setup to initialize the admin user
-- 3. Login at /admin/login with credentials:
--    - Username: Admin
--    - Password: TheLetterA!
-- 4. Start managing your site content!
--
-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- 1. Two-table design: companies and positions for proper grouping
-- 2. Companies can have multiple positions over time
-- 3. Gaps at same company are handled naturally (separate position entries)
-- 4. display_order controls company order in timeline
-- 5. position_order controls position order within a company
-- 6. end_date NULL indicates current position
-- 7. company_logo_url references images in public folder
-- 8. Proper indexes for efficient querying
-- 9. Foreign key constraints ensure data integrity
-- 10. Admin authentication uses bcrypt password hashing
--
-- To add new work history entries:
-- 1. Insert company into work_companies (if new)
-- 2. Insert position into work_positions
-- 3. Set appropriate display_order for company timeline positioning
-- 4. Set appropriate position_order for position ordering within company
-- 5. Upload company logo to public folder
-- 6. Update logo_url to match public folder path
--
-- Example scenarios this handles:
-- - Multiple positions at same company (promotions, role changes)
-- - Gaps at same company (leave and return)
-- - Company name changes (separate company entries)
-- - Proper timeline ordering with gaps
--
-- DEPLOYMENT:
-- 1. Copy entire file content
-- 2. Paste into Supabase SQL Editor
-- 3. Execute to update all schema and functions
-- 4. Verify objects are created successfully
--
-- =====================================================
-- SAMPLE WORK HISTORY DATA
-- =====================================================
-- 
-- NOTE: This sample data is commented out to prevent overwriting existing work history.
-- Uncomment and modify if you need to seed a fresh database.
--
/*
-- Insert real work history companies
INSERT INTO work_companies (id, company_name, company_logo_url, employment_type, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'CaptivateIQ', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/captivateiq_logo.jpeg', 'Remote / Full-time', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'FloSports', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/flosports_logo.jpeg', 'Remote / Full-time', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Automattic', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/automattic_logo.jpeg', 'Remote / Full-time', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'ShareThis', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/sharethis_logo.jpeg', 'Remote / Full-time', 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'USA TODAY Sports', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/usatsportts_logo.jpeg', 'Hybrid / Full-time', 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Levin Media', '', 'Self-employed / Freelance', 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Armada Skis', 'https://jnbfzkqidfvhsvqwbfij.supabase.co/storage/v1/object/public/media/armada_logo.jpg', 'Costa Mesa, CA / Full-time', 7)
ON CONFLICT (company_name) DO NOTHING;

-- Insert real positions for CaptivateIQ
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Principle Designer', 'Designing system architecture for intuitive and scalable product experiences.', '2025-05-01', NULL, 1),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Sr. Manager Product Design', 'Leading product design initiatives and managing design team operations.', '2023-06-01', '2025-05-01', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for FloSports
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Head of Product Design', 'Leading product design. Connecting people with the sports they love.', '2022-05-01', '2023-06-01', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for Automattic
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Product & Design Lead (WooCommerce)', 'Leading product and design for payment solutions at WooCommerce.', '2021-05-01', '2022-05-01', 1),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'Product Design', 'Designing product experiences across the WordPress ecosystem.', '2018-02-01', '2021-05-01', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for ShareThis
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440004', 'Director of UX and Design', 'Vision + execution. Conceptualized and designed a platform of tools to help millions of digital publishers grow their audiences. Led the re-design of share button tools and associated plugins, resulting in a 200% improvement in new user registration, and reduced 24 hour churn from over 50% to less than 10%.', '2016-09-01', '2018-01-01', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for USA TODAY Sports
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440005', 'Design Director', 'Lead all design initiatives at USA TODAY Sports. Worked in conjunction with senior executives at USA TODAY and Gannett to develop and deliver digital product, advertising, and brand marketing solutions. Lead and managed a nationally distributed team of UX / UI designers, art directors and third party vendors. Managed USA TODAY Sports Creative Solutions, a full service in house creative agency producing print and digital advertising for clients of USA TODAY Sports. Led an assessment and reorganization of a nationally distributed design team, resulting in dramatic improvement of group productivity, morale, and overall quality of output. Led design rollout of 16 website launches, or re-launches, between April 2014 and April 2015, including USA TODAY Ad Meter, USA TODAY Bracket Challenge, and the 2016 Olympics Experience. In 2015 the sites accounted for 18% of USA TODAY''s digital advertising revenue.', '2014-01-01', '2016-09-01', 1),
  ('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440005', 'Design Director - Sports Digital Properties', 'Responsible for all creative initiatives at USA TODAY Sports Digital Properties, a sports focused digital advertising network consisting of 12 USA TODAY owned and operated websites (including For The Win, The Big Lead, HoopsHype, and MMA Junkie) plus over 100 affiliate advertising partners. Assumed responsibility of digital product strategy and development in conjunction with Director of Engineering. Responsible for brand marketing of owned and operated properties. Conceptualized and designed a highly customized, device responsive WordPress based publishing solution to consolidate the majority of owned and operated websites onto a single, shared CMS. (The platform is named Lawrence, after our friendly in-office caterer.) The consolidation slashed operational overhead, significantly reduced design and product development time, and radically improved user experiences for visitors and editors. The consolidation contributed to significant increases in revenue and audience. Proposed and launched USA TODAY Sports Creative Solutions, an in-house, full service creative agency for advertising clients of USA TODAY Sports. Produced both print and digital advertising for clients such as Oakley, Under Armor, Asics, ESPN, NBC Sports, UFC, Harley Davidson, State Farm, Mountain Dew, Pacifico, and more.', '2011-01-01', '2013-12-01', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for Levin Media
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440006', 'Design Director', 'Specializing in all manner of design, digital product direction and design, photography, film, motion graphics and video production for primarily outdoor and action sports industry clients. Notable clients include Oakley, Red Bull, Storm Mountain Publishing, publishers of Freeskier and Snowboard Magazine, BNQT Media Group owned by USA TODAY Sports, Poor Boyz Productions, Exile Skimboards, Happy Magazine, and DaKine.', '2006-01-01', '2011-02-01', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert real positions for Armada Skis
INSERT INTO work_positions (id, company_id, position_title, position_description, start_date, end_date, position_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440007', 'Art Director', 'Established the brand identity and creative direction for the most successful start up ski company in history. Responsible for all creative deliverables including hard goods graphics, soft goods graphics, and web development. Responsible for all sales and marketing materials including advertising, catalogs, posters, experiential trade show elements, and point of purchase graphics.', '2002-10-01', '2006-01-01', 1)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- SELECTED WORKS TABLE AND FUNCTIONS
-- =====================================================

-- Create selected works table
CREATE TABLE IF NOT EXISTS selected_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly version of title
    content TEXT NOT NULL, -- Markdown content (same as guestbook)
    
    -- Images
    feature_image_url TEXT NOT NULL, -- 16:9 feature image URL from Supabase Storage
    thumbnail_crop JSONB DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100, "unit": "%"}', -- Crop settings for 1:1 thumbnail
    
    -- Metadata
    is_published BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false, -- Private works are only accessible via direct URL
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Add is_private column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'selected_works' 
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE selected_works ADD COLUMN is_private BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_selected_works_slug ON selected_works(slug);
CREATE INDEX IF NOT EXISTS idx_selected_works_published ON selected_works(is_published, display_order DESC);
CREATE INDEX IF NOT EXISTS idx_selected_works_display_order ON selected_works(display_order DESC);

-- Enable RLS
ALTER TABLE selected_works ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access - selected_works" ON selected_works;
DROP POLICY IF EXISTS "Service role full access - selected_works" ON selected_works;

-- Create RLS policies
CREATE POLICY "Public read access - selected_works" ON selected_works
    FOR SELECT USING (is_published = true);

CREATE POLICY "Service role full access - selected_works" ON selected_works
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get published selected works (public)
CREATE OR REPLACE FUNCTION prod_get_selected_works()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    display_order INTEGER,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only return published works that are NOT private
    -- Private works are only accessible via direct URL (prod_get_selected_work_by_slug)
    RETURN QUERY
    SELECT 
        sw.id,
        sw.title,
        sw.slug,
        sw.content,
        sw.feature_image_url,
        sw.thumbnail_crop,
        sw.display_order,
        sw.published_at
    FROM selected_works sw
    WHERE sw.is_published = true AND sw.is_private = false
    ORDER BY sw.display_order DESC, sw.published_at DESC;
END;
$$;

-- Function to get single selected work by slug (public)
-- This allows access to private works via direct URL
CREATE OR REPLACE FUNCTION prod_get_selected_work_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    display_order INTEGER,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Returns work if published, regardless of is_private status
    -- This enables direct URL access to private works
    RETURN QUERY
    SELECT 
        sw.id,
        sw.title,
        sw.slug,
        sw.content,
        sw.feature_image_url,
        sw.thumbnail_crop,
        sw.display_order,
        sw.published_at
    FROM selected_works sw
    WHERE sw.slug = p_slug AND sw.is_published = true
    LIMIT 1;
END;
$$;

-- Function to get all selected works (admin)
CREATE OR REPLACE FUNCTION prod_get_all_selected_works()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    is_published BOOLEAN,
    is_private BOOLEAN,
    display_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sw.id,
        sw.title,
        sw.slug,
        sw.content,
        sw.feature_image_url,
        sw.thumbnail_crop,
        sw.is_published,
        sw.is_private,
        sw.display_order,
        sw.created_at,
        sw.updated_at,
        sw.published_at
    FROM selected_works sw
    ORDER BY sw.display_order DESC, sw.created_at DESC;
END;
$$;

-- Function to create or update selected work (admin)
CREATE OR REPLACE FUNCTION prod_upsert_selected_work(
    p_title TEXT,
    p_slug TEXT,
    p_content TEXT,
    p_feature_image_url TEXT,
    p_thumbnail_crop JSONB DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100, "unit": "%"}',
    p_is_published BOOLEAN DEFAULT false,
    p_is_private BOOLEAN DEFAULT false,
    p_display_order INTEGER DEFAULT 0,
    p_work_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
    v_published_at TIMESTAMPTZ;
BEGIN
    -- Set published_at if transitioning to published
    IF p_is_published THEN
        IF p_work_id IS NOT NULL THEN
            -- Check if it was previously unpublished
            SELECT published_at INTO v_published_at
            FROM selected_works
            WHERE id = p_work_id;
            
            IF v_published_at IS NULL THEN
                v_published_at := NOW();
            END IF;
        ELSE
            v_published_at := NOW();
        END IF;
    ELSE
        v_published_at := NULL;
    END IF;

    IF p_work_id IS NOT NULL THEN
        -- Update existing work
        UPDATE selected_works 
        SET 
            title = p_title,
            slug = p_slug,
            content = p_content,
            feature_image_url = p_feature_image_url,
            thumbnail_crop = p_thumbnail_crop,
            is_published = p_is_published,
            is_private = p_is_private,
            display_order = p_display_order,
            published_at = v_published_at,
            updated_at = NOW()
        WHERE id = p_work_id
        RETURNING id INTO result_id;
        
        IF result_id IS NULL THEN
            RAISE EXCEPTION 'Selected work with ID % not found', p_work_id;
        END IF;
    ELSE
        -- Insert new work
        INSERT INTO selected_works (
            title, 
            slug, 
            content, 
            feature_image_url, 
            thumbnail_crop, 
            is_published,
            is_private, 
            display_order,
            published_at
        )
        VALUES (
            p_title, 
            p_slug, 
            p_content, 
            p_feature_image_url, 
            p_thumbnail_crop, 
            p_is_published,
            p_is_private, 
            p_display_order,
            v_published_at
        )
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$;

-- Function to delete selected work (admin)
CREATE OR REPLACE FUNCTION prod_delete_selected_work(p_work_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM selected_works WHERE id = p_work_id;
    RETURN FOUND;
END;
$$;

-- Function to update thumbnail crop only (admin)
CREATE OR REPLACE FUNCTION prod_update_thumbnail_crop(
    p_work_id UUID,
    p_thumbnail_crop JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE selected_works 
    SET 
        thumbnail_crop = p_thumbnail_crop,
        updated_at = NOW()
    WHERE id = p_work_id;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- FIELD NOTES TABLE AND FUNCTIONS
-- =====================================================

-- Create field notes table
CREATE TABLE IF NOT EXISTS field_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly version of title
    content TEXT NOT NULL, -- Markdown content (same as selected_works)
    author TEXT NOT NULL DEFAULT 'David Levin', -- Author name
    -- Images
    feature_image_url TEXT NOT NULL, -- 16:9 feature image URL from Supabase Storage
    thumbnail_crop JSONB DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100, "unit": "%"}', -- Crop settings for 1:1 thumbnail
    og_vertical_align TEXT NOT NULL DEFAULT 'center', -- Controls OG image vertical alignment: top|center|bottom
    -- Metadata
    is_published BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false, -- Private notes are only accessible via direct URL
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Add columns if they don't exist (for existing databases)
DO $$ 
BEGIN
    -- Add author column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'field_notes' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE field_notes ADD COLUMN author TEXT NOT NULL DEFAULT 'David Levin';
    END IF;

    -- Add is_private column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'field_notes' 
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE field_notes ADD COLUMN is_private BOOLEAN DEFAULT false;
    END IF;

    -- Add published_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'field_notes' 
        AND column_name = 'published_at'
    ) THEN
        ALTER TABLE field_notes ADD COLUMN published_at TIMESTAMPTZ;
    END IF;

    -- Add og_vertical_align column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'field_notes' 
        AND column_name = 'og_vertical_align'
    ) THEN
        ALTER TABLE field_notes ADD COLUMN og_vertical_align TEXT NOT NULL DEFAULT 'center';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_field_notes_slug ON field_notes(slug);
CREATE INDEX IF NOT EXISTS idx_field_notes_published ON field_notes(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_notes_display_order ON field_notes(display_order DESC);

-- Enable RLS (idempotent - safe to run multiple times, no-op if already enabled)
ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access - field_notes" ON field_notes;
DROP POLICY IF EXISTS "Service role full access - field_notes" ON field_notes;

-- Create RLS policies
CREATE POLICY "Public read access - field_notes" ON field_notes
    FOR SELECT USING (is_published = true);

CREATE POLICY "Service role full access - field_notes" ON field_notes
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get published field notes (public) - reverse chronological by published_at
CREATE OR REPLACE FUNCTION prod_get_field_notes()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    author TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    og_vertical_align TEXT,
    display_order INTEGER,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only return published notes that are NOT private
    -- Private notes are only accessible via direct URL (prod_get_field_note_by_slug)
    RETURN QUERY
    SELECT 
        fn.id,
        fn.title,
        fn.slug,
        fn.content,
        fn.author,
        fn.feature_image_url,
        fn.thumbnail_crop,
        fn.og_vertical_align,
        fn.display_order,
        fn.published_at
    FROM field_notes fn
    WHERE fn.is_published = true AND fn.is_private = false
    ORDER BY fn.published_at DESC NULLS LAST, fn.created_at DESC;
END;
$$;

-- Function to get single field note by slug (public)
-- This allows access to private notes via direct URL
CREATE OR REPLACE FUNCTION prod_get_field_note_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    author TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    og_vertical_align TEXT,
    display_order INTEGER,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Returns note if published, regardless of is_private status
    -- This enables direct URL access to private notes
    RETURN QUERY
    SELECT 
        fn.id,
        fn.title,
        fn.slug,
        fn.content,
        fn.author,
        fn.feature_image_url,
        fn.thumbnail_crop,
        fn.og_vertical_align,
        fn.display_order,
        fn.published_at
    FROM field_notes fn
    WHERE fn.slug = p_slug AND fn.is_published = true
    LIMIT 1;
END;
$$;

-- Function to get all field notes (admin)
CREATE OR REPLACE FUNCTION prod_get_all_field_notes()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    author TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    is_published BOOLEAN,
    is_private BOOLEAN,
    display_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    og_vertical_align TEXT,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fn.id,
        fn.title,
        fn.slug,
        fn.content,
        fn.author,
        fn.feature_image_url,
        fn.thumbnail_crop,
        fn.is_published,
        fn.is_private,
        fn.display_order,
        fn.created_at,
        fn.updated_at,
        fn.og_vertical_align,
        fn.published_at
    FROM field_notes fn
    ORDER BY fn.published_at DESC NULLS LAST, fn.created_at DESC;
END;
$$;

-- Function to create or update field note (admin)
CREATE OR REPLACE FUNCTION prod_upsert_field_note(
    p_title TEXT,
    p_slug TEXT,
    p_content TEXT,
    p_feature_image_url TEXT,
    p_author TEXT DEFAULT 'David Levin',
    p_thumbnail_crop JSONB DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100, "unit": "%"}',
    p_is_published BOOLEAN DEFAULT false,
    p_is_private BOOLEAN DEFAULT false,
    p_display_order INTEGER DEFAULT 0,
    p_og_vertical_align TEXT DEFAULT 'center',
    p_note_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
    v_published_at TIMESTAMPTZ;
BEGIN
    -- Set published_at if transitioning to published
    IF p_is_published THEN
        IF p_note_id IS NOT NULL THEN
            -- Check if it was previously unpublished
            SELECT published_at INTO v_published_at
            FROM field_notes
            WHERE id = p_note_id;
            
            IF v_published_at IS NULL THEN
                v_published_at := NOW();
            END IF;
        ELSE
            v_published_at := NOW();
        END IF;
    ELSE
        v_published_at := NULL;
    END IF;

    IF p_note_id IS NOT NULL THEN
        -- Update existing note
        UPDATE field_notes 
        SET 
            title = p_title,
            slug = p_slug,
            content = p_content,
            author = p_author,
            feature_image_url = p_feature_image_url,
            thumbnail_crop = p_thumbnail_crop,
            og_vertical_align = COALESCE(NULLIF(p_og_vertical_align, ''), 'center'),
            is_published = p_is_published,
            is_private = p_is_private,
            display_order = p_display_order,
            published_at = v_published_at,
            updated_at = NOW()
        WHERE id = p_note_id
        RETURNING id INTO result_id;
        
        IF result_id IS NULL THEN
            RAISE EXCEPTION 'Field note with ID % not found', p_note_id;
        END IF;
    ELSE
        -- Insert new note
        INSERT INTO field_notes (
            title, 
            slug, 
            content,
            author, 
            feature_image_url, 
            thumbnail_crop, 
            og_vertical_align,
            is_published,
            is_private, 
            display_order,
            published_at
        )
        VALUES (
            p_title, 
            p_slug, 
            p_content,
            p_author, 
            p_feature_image_url, 
            p_thumbnail_crop, 
            COALESCE(NULLIF(p_og_vertical_align, ''), 'center'),
            p_is_published,
            p_is_private, 
            p_display_order,
            v_published_at
        )
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$;

-- Function to delete field note (admin)
CREATE OR REPLACE FUNCTION prod_delete_field_note(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM field_notes WHERE id = p_note_id;
    RETURN FOUND;
END;
$$;

-- Function to update thumbnail crop only (admin)
CREATE OR REPLACE FUNCTION prod_update_field_note_thumbnail_crop(
    p_note_id UUID,
    p_thumbnail_crop JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE field_notes 
    SET 
        thumbnail_crop = p_thumbnail_crop,
        updated_at = NOW()
    WHERE id = p_note_id;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- GUESTBOOK TABLE AND FUNCTIONS
-- =====================================================

-- Create guestbook entries table
CREATE TABLE IF NOT EXISTS guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    message TEXT NOT NULL, -- Markdown content
    social_links JSONB DEFAULT '{}', -- {linkedin: "", threads: "", twitter: "", instagram: ""}
    is_approved BOOLEAN DEFAULT true, -- For moderation if needed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_created_at ON guestbook_entries(created_at DESC);

-- Enable RLS
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access - guestbook_entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Service role full access - guestbook_entries" ON guestbook_entries;

-- Create RLS policies
CREATE POLICY "Public read access - guestbook_entries" ON guestbook_entries
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Service role full access - guestbook_entries" ON guestbook_entries
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get guestbook entries (public)
CREATE OR REPLACE FUNCTION prod_get_guestbook_entries()
RETURNS TABLE (
    id UUID,
    name TEXT,
    message TEXT,
    social_links JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ge.id,
        ge.name,
        ge.message,
        ge.social_links,
        ge.created_at
    FROM guestbook_entries ge
    WHERE ge.is_approved = true
    ORDER BY ge.created_at DESC;
END;
$$;

-- Function to create guestbook entry (public)
CREATE OR REPLACE FUNCTION prod_create_guestbook_entry(
    p_name TEXT,
    p_message TEXT,
    p_social_links JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    entry_id UUID;
BEGIN
    INSERT INTO guestbook_entries (name, message, social_links)
    VALUES (p_name, p_message, p_social_links)
    RETURNING id INTO entry_id;
    
    RETURN entry_id;
END;
$$;

-- Function to get all guestbook entries (admin)
CREATE OR REPLACE FUNCTION prod_get_all_guestbook_entries()
RETURNS TABLE (
    id UUID,
    name TEXT,
    message TEXT,
    social_links JSONB,
    is_approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ge.id,
        ge.name,
        ge.message,
        ge.social_links,
        ge.is_approved,
        ge.created_at,
        ge.updated_at
    FROM guestbook_entries ge
    ORDER BY ge.created_at DESC;
END;
$$;

-- Function to update guestbook entry approval status (admin)
CREATE OR REPLACE FUNCTION prod_update_guestbook_entry_status(
    p_entry_id UUID,
    p_is_approved BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE guestbook_entries 
    SET is_approved = p_is_approved, updated_at = NOW()
    WHERE id = p_entry_id;
    
    RETURN FOUND;
END;
$$;

-- Function to delete guestbook entry (admin)
CREATE OR REPLACE FUNCTION prod_delete_guestbook_entry(p_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM guestbook_entries WHERE id = p_entry_id;
    RETURN FOUND;
END;
$$;

-- =====================================================
