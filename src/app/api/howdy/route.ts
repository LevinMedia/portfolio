import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cache indefinitely - only revalidate on-demand when content is updated
export const revalidate = false // or use a very large number like 86400 (1 day)

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('howdy_content')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching howdy data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'No content available' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for a very long time - will be revalidated on-demand
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    })
  } catch (err) {
    console.error('Error in howdy API route:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
