import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all guestbook entries (admin)
export async function GET() {
  try {
    const { data: entries, error } = await supabase.rpc('prod_get_all_guestbook_entries')

    if (error) {
      console.error('Error fetching all guestbook entries:', error)
      return NextResponse.json({ error: 'Failed to fetch guestbook entries' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('Error in admin guestbook GET API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update guestbook entry approval status
export async function PUT(request: NextRequest) {
  try {
    const { entryId, isApproved } = await request.json()

    if (!entryId || typeof isApproved !== 'boolean') {
      return NextResponse.json({ error: 'Entry ID and approval status are required' }, { status: 400 })
    }

    const { data: success, error } = await supabase.rpc('prod_update_guestbook_entry_status', {
      p_entry_id: entryId,
      p_is_approved: isApproved
    })

    if (error) {
      console.error('Error updating guestbook entry status:', error)
      return NextResponse.json({ error: 'Failed to update guestbook entry' }, { status: 500 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Guestbook entry not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Entry ${isApproved ? 'approved' : 'rejected'} successfully` 
    })

  } catch (err) {
    console.error('Error in admin guestbook PUT API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete guestbook entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    const { data: success, error } = await supabase.rpc('prod_delete_guestbook_entry', {
      p_entry_id: entryId
    })

    if (error) {
      console.error('Error deleting guestbook entry:', error)
      return NextResponse.json({ error: 'Failed to delete guestbook entry' }, { status: 500 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Guestbook entry not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Guestbook entry deleted successfully' 
    })

  } catch (err) {
    console.error('Error in admin guestbook DELETE API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
