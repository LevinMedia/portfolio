import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeText } from '@/lib/sanitize'
import { requireAdminApi } from '@/lib/require-admin-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    const { data, error } = await supabase
      .from('howdy_content')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching howdy content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/howdy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    const body = await request.json()
    const { id, image_src, image_alt, greeting, li_1, li_2 } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Sanitize all text inputs to prevent XSS
    const updateData = {
      image_src: sanitizeText(image_src || ''),
      image_alt: sanitizeText(image_alt || ''),
      greeting: sanitizeText(greeting || ''),
      li_1: sanitizeText(li_1 || ''),
      li_2: sanitizeText(li_2 || ''),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('howdy_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating howdy content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/admin/howdy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
