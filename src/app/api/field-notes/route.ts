import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('prod_get_field_notes')

    if (error) {
      console.error('Error fetching field notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch field notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: data || [] })
  } catch (error) {
    console.error('Error in field notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

