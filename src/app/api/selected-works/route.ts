import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('prod_get_selected_works')

    if (error) {
      console.error('Error fetching selected works:', error)
      return NextResponse.json(
        { error: 'Failed to fetch selected works' },
        { status: 500 }
      )
    }

    return NextResponse.json({ works: data || [] })
  } catch (error) {
    console.error('Error in selected works API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
