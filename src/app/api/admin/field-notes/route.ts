import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeText, sanitizeMarkdown } from '@/lib/sanitize'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all field notes (admin)
export async function GET() {
  try {
    const { data, error } = await supabase.rpc('prod_get_all_field_notes')

    if (error) {
      console.error('Error fetching all field notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch field notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: data || [] })
  } catch (error) {
    console.error('Error in admin field notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update field note
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      title,
      slug,
      content,
      author,
      feature_image_url,
      thumbnail_crop,
      is_published,
      is_private,
      display_order
    } = body

    // Validate required fields
    if (!title || !slug || !content || !feature_image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent XSS
    const sanitizedTitle = sanitizeText(title)
    const sanitizedSlug = sanitizeText(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const sanitizedContent = sanitizeMarkdown(content)
    const sanitizedImageUrl = sanitizeText(feature_image_url)
    const sanitizedAuthor = sanitizeText(author || 'David Levin')

    const { data, error } = await supabase.rpc('prod_upsert_field_note', {
      p_title: sanitizedTitle,
      p_slug: sanitizedSlug,
      p_content: sanitizedContent,
      p_author: sanitizedAuthor,
      p_feature_image_url: sanitizedImageUrl,
      p_thumbnail_crop: thumbnail_crop || { x: 0, y: 0, width: 100, height: 100, unit: '%' },
      p_is_published: is_published || false,
      p_is_private: is_private || false,
      p_display_order: display_order || 0,
      p_note_id: id || null
    })

    if (error) {
      console.error('Error upserting field note:', error)
      return NextResponse.json(
        { error: 'Failed to save field note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data })
  } catch (error) {
    console.error('Error in admin field notes POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete field note
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing note ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('prod_delete_field_note', {
      p_note_id: id
    })

    if (error) {
      console.error('Error deleting field note:', error)
      return NextResponse.json(
        { error: 'Failed to delete field note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: data })
  } catch (error) {
    console.error('Error in admin field notes DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update display order for notes
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { notes } = body as { notes?: { id: string; display_order: number }[] }

    if (!Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()

    const updates = notes.filter(
      (note): note is { id: string; display_order: number } =>
        typeof note.id === 'string' && typeof note.display_order === 'number' && Number.isFinite(note.display_order)
    )

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid notes provided' },
        { status: 400 }
      )
    }

    for (const note of updates) {
      const { error } = await supabase
        .from('field_notes')
        .update({
          display_order: note.display_order,
          updated_at: timestamp
        })
        .eq('id', note.id)

      if (error) {
        console.error(`Error updating display order for note ${note.id}:`, error)
        return NextResponse.json(
          { error: 'Failed to update display order' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in admin field notes PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update thumbnail crop only
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, thumbnail_crop } = body

    if (!id || !thumbnail_crop) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('prod_update_field_note_thumbnail_crop', {
      p_note_id: id,
      p_thumbnail_crop: thumbnail_crop
    })

    if (error) {
      console.error('Error updating thumbnail crop:', error)
      return NextResponse.json(
        { error: 'Failed to update thumbnail crop' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: data })
  } catch (error) {
    console.error('Error in admin field notes PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

