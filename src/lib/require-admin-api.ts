import { NextResponse } from 'next/server'
import { getAuthCookiePayload, type AuthPayload } from '@/lib/auth-cookie'

/** Returns admin auth payload, or a 401 response when the caller is not an admin. */
export async function requireAdminApi(): Promise<AuthPayload | NextResponse> {
  const payload = await getAuthCookiePayload()
  if (payload?.access_role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return payload
}
