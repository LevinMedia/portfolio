# Admin Interface Setup Guide

This guide will help you set up and use the admin interface for your LevinMedia site.

## 🚀 Quick Start

### 1. Database Setup
1. Copy the contents of `db/prod_functions.sql`
2. Paste into your Supabase SQL Editor
3. Execute the script to create all tables and functions

### 2. Admin User Setup
1. Visit `/admin/setup` in your browser
2. Click "Setup Admin User" to create the default admin account
3. Note the login credentials displayed

### 3. Login to Admin Panel
1. Go to `/admin/login`
2. Use the credentials:
   - **Username:** `Admin`
   - **Password:** `[Set in environment variables]`

## 📋 Admin Features

### Available Sections

#### 🏠 Dashboard (`/admin`)
- Overview of site statistics
- Quick access to all admin sections
- Recent activity feed

#### 👋 Howdy Management (`/admin/howdy`)
- Edit the main greeting section
- Update profile image and alt text
- Modify greeting text and list items
- Live preview of changes

#### 💼 Work History (`/admin/work-history`)
- **Add/Edit Companies:** Manage company information, logos, and employment types
- **Add/Edit Positions:** Create multiple positions per company with dates and descriptions
- **Delete:** Remove companies and positions
- **Expandable View:** Click to expand companies and see all positions
- **Drag & Drop Ordering:** Control display order with position_order and display_order fields

#### 🎨 Selected Work (`/admin/selected-work`)
- Manage featured work samples
- *Coming soon in future updates*

#### 📖 About Section (`/admin/about`)
- Edit about page content
- *Coming soon in future updates*

#### 📊 Site Statistics (`/admin/stats`)
- View analytics and metrics
- *Coming soon in future updates*

#### 📝 Guestbook (`/admin/guestbook`)
- Manage visitor messages
- *Coming soon in future updates*

## 🔧 Technical Details

### Database Schema

#### Admin Users Table
```sql
admin_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  email TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
)
```

#### Work History Tables
```sql
work_companies (
  id UUID PRIMARY KEY,
  company_name TEXT UNIQUE,
  company_logo_url TEXT,
  employment_type TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

work_positions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES work_companies(id),
  position_title TEXT,
  position_description TEXT,
  start_date DATE,
  end_date DATE,
  position_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### API Endpoints

#### Authentication
- `POST /api/admin/auth` - Admin login
- `POST /api/admin/setup-admin` - Initialize admin user

#### Work History
- `GET /api/admin/work-history` - Get all work history
- `POST /api/admin/work-history` - Create company/position
- `PUT /api/admin/work-history` - Update company/position
- `DELETE /api/admin/work-history` - Delete company/position

#### Howdy Content
- `GET /api/howdy` - Get howdy content (existing)
- `PUT /api/howdy` - Update howdy content (*to be implemented*)

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Service Role Only** access for admin operations
- **bcrypt password hashing** for secure authentication
- **Session-based authentication** using sessionStorage
- **Protected routes** that redirect to login if not authenticated

## 🎨 UI/UX Features

### Responsive Design
- **Desktop:** Full sidebar navigation with collapse/expand
- **Mobile:** Drawer-style navigation that slides in from left
- **Tablet:** Adaptive layout that works on all screen sizes

### Navigation
- **Collapsible Sidebar:** Click the chevron to minimize sidebar
- **Active State:** Current page is highlighted in navigation
- **Icon + Text:** Clear visual hierarchy with Heroicons

### Form Features
- **Modal Forms:** Clean, focused editing experience
- **Live Preview:** See changes before saving (Howdy section)
- **Validation:** Form validation and error handling
- **Loading States:** Visual feedback during API calls

## 🔄 Work History Management

### Adding Companies
1. Click "Add Company" button
2. Fill in company details:
   - Company name (required)
   - Logo URL (optional)
   - Employment type (dropdown)
   - Display order (number for timeline positioning)
3. Click "Save"

### Adding Positions
1. Expand a company by clicking the chevron
2. Click the "+" button next to the company name
3. Fill in position details:
   - Position title (required)
   - Description (optional)
   - Start date (required)
   - End date (optional - leave empty for current position)
   - Position order (number for ordering within company)
4. Click "Save"

### Editing
- Click the pencil icon next to any company or position
- Modify the details in the modal form
- Click "Save" to update

### Deleting
- Click the trash icon next to any company or position
- Confirm deletion in the browser dialog
- Companies will delete all associated positions

## 🚨 Troubleshooting

### Common Issues

#### "Admin user already exists"
- This is normal if you've already run the setup
- You can proceed directly to `/admin/login`

#### "Invalid credentials" error
- Double-check username is exactly "Admin" (case-sensitive)
- Ensure password matches your environment variable `DEFAULT_ADMIN_PASSWORD`
- Try running setup again if needed

#### Database connection errors
- Verify your Supabase environment variables are set correctly
- Check that the database schema has been deployed
- Ensure RLS policies are properly configured

#### API errors
- Check browser console for detailed error messages
- Verify Supabase service role key has proper permissions
- Ensure all database functions are deployed correctly

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔮 Future Enhancements

Planned features for future updates:
- Image upload for company logos and howdy profile
- Bulk import/export for work history
- Advanced analytics and reporting
- Guestbook management with moderation tools
- Content versioning and history
- Multi-user admin support
- Advanced permissions system

## 📞 Support

If you encounter any issues:
1. Check this README for troubleshooting steps
2. Verify your database setup matches the schema
3. Check browser console for error messages
4. Ensure all environment variables are configured

---

**Happy Admin-ing! 🎉**
