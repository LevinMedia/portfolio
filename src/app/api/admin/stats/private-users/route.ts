import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload } from '@/lib/auth-cookie'

export type PrivateUserActivity = {
  id: string
  email: string
  signInCount: number
  pageViewCount: number
  lastSignInAt: string | null
  lastPageViewAt: string | null
  lastPageViewPath: string | null
  /** Recent page views (path + time), newest first, capped per user */
  pageViews: { path: string; occurred_at: string }[]
}

/** Returns private users with sign-in and page-view counts (admin only). */
export async function GET() {
  const payload = await getAuthCookiePayload()
  if (payload?.access_role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users, error: usersErr } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('access_role', 'private')
    .order('email')

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })
  if (!users?.length) return NextResponse.json({ users: [] })

  const ids = users.map((u) => u.id)

  const [signInsRes, pageViewsRes] = await Promise.all([
    supabase.from('analytics_private_sign_ins').select('private_user_id, occurred_at').in('private_user_id', ids),
    supabase
      .from('analytics_pageviews')
      .select('private_user_id, path, occurred_at')
      .not('private_user_id', 'is', null)
      .in('private_user_id', ids)
  ])

  const signInsByUser = new Map<string, { count: number; lastAt: string | null }>()
  for (const uid of ids) signInsByUser.set(uid, { count: 0, lastAt: null })
  for (const row of signInsRes.data || []) {
    const cur = signInsByUser.get(row.private_user_id)!
    cur.count += 1
    if (!cur.lastAt || row.occurred_at > cur.lastAt) cur.lastAt = row.occurred_at
  }

  const pageViewsByUser = new Map<string, { count: number; lastAt: string | null; lastPath: string | null; list: { path: string; occurred_at: string }[] }>()
  for (const uid of ids) pageViewsByUser.set(uid, { count: 0, lastAt: null, lastPath: null, list: [] })
  for (const row of pageViewsRes.data || []) {
    const uid = row.private_user_id as string
    const cur = pageViewsByUser.get(uid)!
    cur.count += 1
    if (!cur.lastAt || row.occurred_at > cur.lastAt) {
      cur.lastAt = row.occurred_at
      cur.lastPath = row.path
    }
    cur.list.push({ path: row.path, occurred_at: row.occurred_at })
  }
  // Sort each user's list by newest first and cap at 100
  const maxPerUser = 100
  for (const cur of pageViewsByUser.values()) {
    cur.list.sort((a, b) => (b.occurred_at > a.occurred_at ? 1 : -1))
    if (cur.list.length > maxPerUser) cur.list = cur.list.slice(0, maxPerUser)
  }

  const usersWithActivity: PrivateUserActivity[] = users.map((u) => {
    const si = signInsByUser.get(u.id)!
    const pv = pageViewsByUser.get(u.id)!
    return {
      id: u.id,
      email: u.email ?? '',
      signInCount: si.count,
      pageViewCount: pv.count,
      lastSignInAt: si.lastAt,
      lastPageViewAt: pv.lastAt,
      lastPageViewPath: pv.lastPath,
      pageViews: pv.list
    }
  })

  return NextResponse.json({ users: usersWithActivity })
}
