import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookiePayload } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const payload = await getAuthCookiePayload()
    const isAdmin = payload?.access_role === 'admin'
    const bearerOk = process.env.REVALIDATION_SECRET && authHeader === `Bearer ${process.env.REVALIDATION_SECRET}`

    if (!isAdmin && !bearerOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate the home page and the howdy API route
    revalidatePath('/')
    revalidatePath('/api/howdy')
    
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    console.error('Error revalidating:', err)
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    )
  }
}

