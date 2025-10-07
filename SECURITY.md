# Security

## XSS Protection

This application implements multiple layers of XSS (Cross-Site Scripting) protection:

### 1. Input Sanitization

All user inputs are sanitized using DOMPurify before being stored in the database:

- **Markdown Content** (Guestbook, Selected Works): Uses `sanitizeMarkdown()` which allows safe markdown/HTML elements but strips dangerous scripts, event handlers, and unsafe protocols.
- **Plain Text** (Names, Titles, etc.): Uses `sanitizeText()` which strips all HTML tags and normalizes whitespace.
- **URLs** (Social Links, Images): Uses `sanitizeUrl()` which validates protocols (http/https/mailto only) and blocks javascript: protocol attempts.

### 2. React's Built-in Protection

React automatically escapes all values rendered in JSX, preventing XSS by default. We rely on this for rendering user content.

### 3. ReactMarkdown Configuration

For markdown rendering, we use `react-markdown` with:
- Explicit component mappings for all HTML elements
- No `dangerouslySetInnerHTML` usage
- Controlled rendering of links and images

### 4. Security Headers

The following security headers are set in `next.config.ts`:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts access to browser features

### 5. Database Security

- Row Level Security (RLS) is enabled on all Supabase tables
- Service role key is only used server-side (API routes)
- Public access is read-only for approved content

## Protected Endpoints

### Public Endpoints (Input Sanitization Applied)
- `POST /api/guestbook` - Creates guestbook entries with sanitized name, message, and social links

### Admin Endpoints (Authentication Required + Input Sanitization)
- `PUT /api/admin/howdy` - Updates homepage content
- `POST /api/admin/selected-works` - Creates/updates portfolio works
- `POST /api/admin/work-history` - Creates/updates work history
- `PUT /api/admin/work-history` - Updates work history

## Best Practices

### For Developers

1. **Never use `dangerouslySetInnerHTML`** - Always render user content through React components or sanitized markdown.

2. **Always sanitize user input** - Import and use the sanitization functions from `@/lib/sanitize`:
   ```typescript
   import { sanitizeText, sanitizeMarkdown, sanitizeUrl } from '@/lib/sanitize'
   
   const clean = sanitizeText(userInput)
   ```

3. **Validate input on both client and server** - Never trust client-side validation alone.

4. **Use parameterized queries** - Supabase RPC functions prevent SQL injection by design.

5. **Keep dependencies updated** - Regularly run `npm audit` and update packages.

### For Content Editors

1. **Be cautious with links** - Only include links to trusted sources.

2. **Review user-submitted content** - Check guestbook entries before approving (if moderation is enabled).

3. **Use strong passwords** - Admin accounts should use unique, complex passwords.

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue. This allows us to address the issue before it can be exploited.

## Security Checklist

- [x] Input sanitization on all user inputs
- [x] Output encoding via React and ReactMarkdown
- [x] Security headers configured
- [x] HTTPS enforced (via Vercel)
- [x] Database RLS policies enabled
- [x] No API keys or secrets in frontend code
- [x] Service role key only used server-side
- [x] No eval() or Function() constructor usage
- [x] No dangerouslySetInnerHTML usage
- [x] URL validation for user-provided links
- [x] File upload validation (images only)
- [x] Rate limiting recommended for production (via Vercel or middleware)

## Additional Security Recommendations

For production deployments, consider:

1. **Rate Limiting** - Add rate limiting to API endpoints to prevent abuse
2. **CAPTCHA** - Add CAPTCHA to the guestbook form to prevent spam
3. **Content Moderation** - Enable `is_approved` flag for guestbook entries
4. **Session Security** - Currently using sessionStorage, consider upgrading to httpOnly cookies for admin sessions
5. **CSP Headers** - Consider adding Content-Security-Policy headers (complex with Next.js and external resources)
6. **Monitoring** - Set up logging and monitoring for suspicious activity

