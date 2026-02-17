import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload, hasPrivateAccess } from '@/lib/auth-cookie'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // If cookie is missing (e.g. blocker) we fall back to public list — no error, graceful degradation
    let includePrivate = false
    try {
      const payload = await getAuthCookiePayload()
      if (payload && hasPrivateAccess(payload.access_role)) includePrivate = true
    } catch {
      // AUTH_SECRET missing or cookie invalid: treat as no access
    }

    const rpc = includePrivate ? 'prod_get_selected_works_include_private' : 'prod_get_selected_works'
    let result = await supabase.rpc(rpc)

    if (result.error && includePrivate) {
      // RPC may not exist yet (migration not run); fall back to public list
      result = await supabase.rpc('prod_get_selected_works')
    }
    const { data, error } = result

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
