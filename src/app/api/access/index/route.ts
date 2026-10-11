import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthCookiePayload } from '@/lib/auth-cookie'
import { toPrivateIndexData, type PrivateIndexRow } from '@/lib/private-index'

export const dynamic = 'force-dynamic'

function respond(index: ReturnType<typeof toPrivateIndexData>) {
  const res = NextResponse.json({ index })
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}

/** The signed-in password-access viewer's own Index, or `{ index: null }` when they have none. */
export async function GET() {
  try {
    const payload = await getAuthCookiePayload()
    if (!payload || payload.access_role !== 'private') return respond(null)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', payload.sub)
      .eq('access_role', 'private')
      .maybeSingle()

    if (error || !data) return respond(null)

    return respond(toPrivateIndexData(data as PrivateIndexRow))
  } catch (err) {
    console.error('Error in access index GET:', err)
    return respond(null)
  }
}
