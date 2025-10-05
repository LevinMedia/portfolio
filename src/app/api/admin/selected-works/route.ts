import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all selected works (admin)
export async function GET() {
  try {
    const { data, error } = await supabase.rpc('prod_get_all_selected_works')

    if (error) {
      console.error('Error fetching all selected works:', error)
      return NextResponse.json(
        { error: 'Failed to fetch selected works' },
        { status: 500 }
      )
    }

    return NextResponse.json({ works: data || [] })
  } catch (error) {
    console.error('Error in admin selected works API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update selected work
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      title,
      slug,
      content,
      feature_image_url,
      thumbnail_crop,
      is_published,
      display_order
    } = body

    // Validate required fields
    if (!title || !slug || !content || !feature_image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('prod_upsert_selected_work', {
      p_title: title,
      p_slug: slug,
      p_content: content,
      p_feature_image_url: feature_image_url,
      p_thumbnail_crop: thumbnail_crop || { x: 0, y: 0, width: 100, height: 100, unit: '%' },
      p_is_published: is_published || false,
      p_display_order: display_order || 0,
      p_work_id: id || null
    })

    if (error) {
      console.error('Error upserting selected work:', error)
      return NextResponse.json(
        { error: 'Failed to save selected work' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data })
  } catch (error) {
    console.error('Error in admin selected works POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete selected work
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing work ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('prod_delete_selected_work', {
      p_work_id: id
    })

    if (error) {
      console.error('Error deleting selected work:', error)
      return NextResponse.json(
        { error: 'Failed to delete selected work' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: data })
  } catch (error) {
    console.error('Error in admin selected works DELETE:', error)
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

    const { data, error } = await supabase.rpc('prod_update_thumbnail_crop', {
      p_work_id: id,
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
    console.error('Error in admin selected works PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
