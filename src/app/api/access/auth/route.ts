import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createAuthCookie } from '@/lib/auth-cookie'
import { displayPrivateAccessLabel } from '@/lib/private-access'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('access_role', 'private')
      .eq('is_active', true)

    if (error || !users?.length) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    let matched: (typeof users)[number] | null = null
    for (const user of users) {
      const passwordHash = (user as { password_hash?: string }).password_hash
      if (!passwordHash) continue
      if (await bcrypt.compare(password, passwordHash)) {
        matched = user
        break
      }
    }

    if (!matched) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', matched.id)

    void supabase
      .from('analytics_private_sign_ins')
      .insert({ private_user_id: matched.id })
      .then(() => {})

    const label = displayPrivateAccessLabel(matched as { label?: string; email?: string; username?: string })

    try {
      const cookie = createAuthCookie({
        sub: matched.id,
        email: matched.email ?? '',
        access_role: 'private',
      })
      const res = NextResponse.json({
        label,
        access_role: 'private',
      })
      res.headers.set('Set-Cookie', cookie)
      return res
    } catch (e) {
      console.warn('Auth cookie not set (AUTH_SECRET?):', e)
      const cookieErrorMessage =
        process.env.NODE_ENV === 'development'
          ? 'Add AUTH_SECRET to .env.local (min 16 chars), restart dev server, then try again.'
          : 'Sign-in could not be completed. Please try again later or contact the site administrator.'
      return NextResponse.json(
        {
          label,
          access_role: 'private',
          cookie_set: false,
          cookie_error: cookieErrorMessage,
        },
        { status: 200 },
      )
    }
  } catch (err) {
    console.error('Error in access auth:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
