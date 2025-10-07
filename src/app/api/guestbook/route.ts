import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeMarkdown, sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all approved guestbook entries
export async function GET() {
  try {
    const { data: entries, error } = await supabase.rpc('prod_get_guestbook_entries')

    if (error) {
      console.error('Error fetching guestbook entries:', error)
      return NextResponse.json({ error: 'Failed to fetch guestbook entries' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('Error in guestbook GET API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new guestbook entry
export async function POST(request: NextRequest) {
  try {
    const { name, message, socialLinks } = await request.json()

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Validate name length
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be less than 100 characters' }, { status: 400 })
    }

    // Validate message length
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be less than 5000 characters' }, { status: 400 })
    }

    // Sanitize inputs to prevent XSS
    const sanitizedName = sanitizeText(name)
    const sanitizedMessage = sanitizeMarkdown(message)

    // Validate social links structure and sanitize URLs
    const validSocialLinks = {
      linkedin: sanitizeUrl(socialLinks?.linkedin || ''),
      threads: sanitizeUrl(socialLinks?.threads || ''),
      twitter: sanitizeUrl(socialLinks?.twitter || ''),
      instagram: sanitizeUrl(socialLinks?.instagram || '')
    }

    // Validate social links are URLs if provided (after sanitization)
    const urlPattern = /^https?:\/\/.+/i
    for (const [platform, url] of Object.entries(validSocialLinks)) {
      if (url && !urlPattern.test(url)) {
        return NextResponse.json({ error: `${platform} must be a valid URL` }, { status: 400 })
      }
    }

    // Create the guestbook entry with sanitized data
    const { data: entryId, error } = await supabase.rpc('prod_create_guestbook_entry', {
      p_name: sanitizedName,
      p_message: sanitizedMessage,
      p_social_links: validSocialLinks
    })

    if (error) {
      console.error('Error creating guestbook entry:', error)
      return NextResponse.json({ error: 'Failed to create guestbook entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      entryId,
      message: 'Guestbook entry created successfully!' 
    })

  } catch (err) {
    console.error('Error in guestbook POST API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
