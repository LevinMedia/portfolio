-- Reset setup state to allow secure setup to run again
-- Run this in Supabase SQL Editor if you need to reset the setup

-- Option 1: Reset setup state only (keeps any existing admin users)
UPDATE setup_state SET setup_completed = false, completed_at = NULL;

-- Option 2: Delete setup state record entirely
-- DELETE FROM setup_state;

-- Option 3: Complete reset - remove setup state AND admin users
-- DELETE FROM setup_state;
-- DELETE FROM admin_users;

-- Check current state
SELECT 
    'setup_state' as table_name,
    setup_completed::text as status,
    completed_at
FROM setup_state
UNION ALL
SELECT 
    'admin_users' as table_name,
    CASE WHEN COUNT(*) > 0 THEN 'has_users' ELSE 'no_users' END as status,
    NULL as completed_at
FROM admin_users;
