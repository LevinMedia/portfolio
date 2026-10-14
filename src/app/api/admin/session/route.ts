import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'

/** Confirms the caller is an admin. Returns no profile or content. */
export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  return NextResponse.json({ ok: true })
}
