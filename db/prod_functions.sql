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

-- Drop existing functions if they exist
-- (No functions to drop yet)

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS work_positions CASCADE;
DROP TABLE IF EXISTS work_companies CASCADE;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_work_companies_display_order;
DROP INDEX IF EXISTS idx_work_companies_name;
DROP INDEX IF EXISTS idx_work_positions_company_date;
DROP INDEX IF EXISTS idx_work_positions_dates;
DROP INDEX IF EXISTS idx_work_positions_order;

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
ALTER TABLE work_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE howdy_content ENABLE ROW LEVEL SECURITY;

-- Create policies that only allow service role access
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
-- 
-- (Functions will be added here as needed)
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
