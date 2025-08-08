# Database Management

This folder contains all database-related files for the LevinMedia site.

## Structure

```
db/
├── README.md                 # This file
├── prod_functions.sql        # Production database functions
├── migrations/               # Database migrations (future)
└── temp_fixes/              # One-time fixes (future)
```

## Conventions

### Production Functions (`prod_functions.sql`)
- **Prefix**: All functions must be prefixed with `prod_`
- **Purpose**: Core functionality that powers the site
- **Examples**: 
  - `prod_get_guestbook_entries()`
  - `prod_add_guestbook_entry()`
  - `prod_get_site_stats()`

### One-Time Fixes
- **Location**: Create separate files in `temp_fixes/` folder
- **Naming**: Use descriptive names like `fix_duplicate_entries_2024_01.sql`
- **Purpose**: Temporary fixes, data cleanup, migrations

### Migrations (Future)
- **Location**: `migrations/` folder
- **Naming**: `YYYY_MM_DD_description.sql`
- **Purpose**: Schema changes, table creation, structural updates

## Usage

### Deploying Production Functions
1. Copy the contents of `prod_functions.sql`
2. Paste into Supabase SQL Editor
3. Execute the script
4. Verify functions are created with `prod_` prefix

### Adding New Production Functions
1. Add function to `prod_functions.sql`
2. Include proper documentation
3. Add appropriate GRANT statements
4. Test thoroughly before deploying

### One-Time Fixes
1. Create new file in `temp_fixes/` folder
2. Use descriptive filename
3. Document the issue and solution
4. Execute in Supabase SQL Editor
5. Keep file for reference but don't re-run

## Best Practices

- ✅ Always use `prod_` prefix for production functions
- ✅ Document function purpose and usage
- ✅ Include proper GRANT statements
- ✅ Test functions before deploying
- ✅ Keep one-time fixes separate
- ✅ Use SECURITY DEFINER for elevated privileges
- ❌ Don't mix production functions with temporary fixes
- ❌ Don't re-run one-time fixes
- ❌ Don't commit sensitive data or keys

## Database Tables

### guestbook_entries
```sql
CREATE TABLE guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- Functions use `SECURITY DEFINER` for elevated privileges
- Proper permissions granted to `authenticated` and `anon` roles
- Sensitive operations require authentication
- Read-only functions available to anonymous users
