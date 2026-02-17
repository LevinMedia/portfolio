import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-cookie'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', clearAuthCookie())
  return res
}
