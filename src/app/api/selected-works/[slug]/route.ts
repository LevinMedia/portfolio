import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { data, error } = await supabase.rpc('prod_get_selected_work_by_slug', {
      p_slug: slug
    })

    if (error) {
      console.error('Error fetching selected work:', error)
      return NextResponse.json(
        { error: 'Failed to fetch selected work' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ work: data[0] })
  } catch (error) {
    console.error('Error in selected work API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
