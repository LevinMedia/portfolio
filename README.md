# 🎨 Levin Media Portfolio

> My personal portfolio site, built with Next.js, Supabase, and a whole lot of creativity. Open sourced for anyone to tinker with! 🎉

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LevinMedia/portfolio)

## ✨ Features

- 🎭 **Theme System** - Light/Dark mode with custom color preferences
- 📝 **Guestbook** - MySpace-style guestbook with Milkdown WYSIWYG editor
- 🖼️ **Image Uploads** - Drag & drop images with Supabase storage
- 🔒 **Admin Panel** - Secure admin interface for content management
- 📊 **Work History** - Dynamic work history with company logos
- 🎨 **Design System** - Custom component library with Storybook
- 📱 **Responsive** - Mobile-first design with beautiful grid backgrounds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works great!)

### 1. Clone the Repository

```bash
git clone https://github.com/LevinMedia/portfolio.git
cd portfolio
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy your project URL and keys

### 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**⚠️ Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

### 4. Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Copy the contents of `db/prod_functions.sql`
3. Paste and run the SQL script

This creates all necessary tables, functions, and security policies:
- `admin_users` - Admin authentication
- `setup_state` - One-time setup tracking
- `howdy_content` - Homepage content
- `work_companies` & `work_positions` - Work history
- `guestbook_entries` - Guestbook messages

### 5. Set Up Storage

1. In Supabase, go to **Storage**
2. Create a new bucket called `media`
3. Set it to **Public** (for serving images)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're ready! 🎉

### 7. Initial Admin Setup

On first run, visit `/admin` - you'll be redirected to a one-time secure setup page where you create your admin credentials.

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard & content management
│   │   ├── api/             # API routes for data & auth
│   │   ├── components/      # Reusable React components
│   │   └── site-settings/   # Theme & design system controls
│   └── stories/             # Storybook component documentation
├── db/
│   └── prod_functions.sql   # Database schema & functions
└── public/                  # Static assets (images, logos)
```

## 🎨 Key Technologies

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[Supabase](https://supabase.com)** - Backend, database, auth, and storage
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first styling
- **[Milkdown](https://milkdown.dev)** - WYSIWYG markdown editor
- **[Storybook](https://storybook.js.org)** - Component development
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run storybook    # Start Storybook
npm run build-storybook  # Build Storybook
```

## 🎭 Theme Customization

The site uses CSS variables for theming. Edit `src/app/globals.css` to customize:

```css
:root {
  --primary: #C614E1;      /* Brand primary */
  --secondary: #ec4899;    /* Secondary accent */
  --accent: #0891b2;       /* Tertiary accent */
  /* ... more theme variables */
}
```

Access theme controls at `/site-settings` (linked from the Howdy component).

## 🖼️ Image Management

Images are stored in Supabase Storage under the `media` bucket:
- `images/` - General images
- `company-logos/` - Work history logos
- `guestbook/` - Guestbook uploads

The image uploader includes cropping functionality powered by `react-easy-crop`.

## 🔐 Admin Features

The admin panel (`/admin`) includes:
- **Howdy Content** - Edit homepage greeting with WYSIWYG
- **Work History** - Manage companies and positions
- **Guestbook** - Moderate messages (approve/reject/delete)
- **Site Settings** - Theme and design system controls

## 📝 Guestbook

The guestbook features:
- Rich text editing with Milkdown (slash commands, formatting)
- Image uploads with drag & drop
- Social links (LinkedIn, Threads, Twitter, Instagram)
- Admin moderation system
- Markdown rendering with GFM support

## 🧪 Development Tips

### Running Storybook

```bash
npm run storybook
```

View components in isolation at [http://localhost:6006](http://localhost:6006)

### Database Migrations

When updating the database schema, edit `db/prod_functions.sql` and run it in the Supabase SQL Editor.

**Pro tip**: The script uses `DROP POLICY IF EXISTS` and `CREATE OR REPLACE FUNCTION` for safe re-runs.

### Environment Variables

For production deployment (Vercel, etc.), set these environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🤝 Contributing

This is my personal portfolio, but I've open sourced it so anyone can tinker! 

**PRs are welcome!** 🎉

Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 Design enhancements

Feel free to fork, experiment, and submit a pull request!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💬 Questions?

Feel free to [open an issue](https://github.com/LevinMedia/portfolio/issues) if you have questions or run into problems!

## 🙏 Acknowledgments

Built with ❤️ by [David Levin](https://levinmedia.com)

Special thanks to the open source community for the amazing tools that made this possible!

---

**Now go build something awesome!** 🚀✨
