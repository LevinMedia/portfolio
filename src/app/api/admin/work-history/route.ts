import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

export async function GET() {
  try {
    console.log('GET /api/admin/work-history called')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Calling prod_get_work_history function...')
    // Get all work companies with their positions
    const { data, error } = await supabase.rpc('prod_get_work_history')

    if (error) {
      console.error('Error fetching work history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Work history data:', data)
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in work history API:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result

    if (type === 'company') {
      // Add new company (sanitize inputs)
      result = await supabase.rpc('prod_upsert_work_company', {
        p_company_name: sanitizeText(data.company_name),
        p_company_logo_url: sanitizeUrl(data.company_logo_url || '') || null,
        p_employment_type: sanitizeText(data.employment_type || '') || null,
        p_display_order: data.display_order || 0,
        p_company_id: null
      })
    } else if (type === 'position') {
      // Add new position (sanitize inputs)
      result = await supabase.rpc('prod_upsert_work_position', {
        p_company_id: data.company_id,
        p_position_title: sanitizeText(data.position_title),
        p_start_date: data.start_date,
        p_position_description: sanitizeText(data.position_description || '') || null,
        p_end_date: data.end_date || null,
        p_position_order: data.position_order || 0,
        p_position_id: null
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (result.error) {
      console.error('Error creating work history item:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ id: result.data })
  } catch (err) {
    console.error('Error in work history API:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { type, id, data } = await request.json()

    if (!type || !id || !data) {
      return NextResponse.json({ error: 'Type, id, and data are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result

    if (type === 'company') {
      // Update company (sanitize inputs)
      result = await supabase.rpc('prod_upsert_work_company', {
        p_company_name: sanitizeText(data.company_name),
        p_company_logo_url: sanitizeUrl(data.company_logo_url || '') || null,
        p_employment_type: sanitizeText(data.employment_type || '') || null,
        p_display_order: data.display_order || 0,
        p_company_id: id
      })
    } else if (type === 'position') {
      // Update position (sanitize inputs)
      result = await supabase.rpc('prod_upsert_work_position', {
        p_company_id: data.company_id,
        p_position_title: sanitizeText(data.position_title),
        p_start_date: data.start_date,
        p_position_description: sanitizeText(data.position_description || '') || null,
        p_end_date: data.end_date || null,
        p_position_order: data.position_order || 0,
        p_position_id: id
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (result.error) {
      console.error('Error updating work history item:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ id: result.data })
  } catch (err) {
    console.error('Error in work history API:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and id are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result

    if (type === 'company') {
      // Delete company
      result = await supabase.rpc('prod_delete_work_company', {
        p_company_id: id
      })
    } else if (type === 'position') {
      // Delete position
      result = await supabase.rpc('prod_delete_work_position', {
        p_position_id: id
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (result.error) {
      console.error('Error deleting work history item:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: result.data })
  } catch (err) {
    console.error('Error in work history API:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
