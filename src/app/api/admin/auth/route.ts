import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Normalize email to match private-users creation (trim + lowercase); Postgres text comparison is case-sensitive.
    const emailNormalized = String(email).trim().toLowerCase()
    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from database (admin and private-access users). Select * so we get password_hash
    // and access_role when present (migration may not be run yet).
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', emailNormalized)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordHash = (user as { password_hash?: string }).password_hash
    if (!passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Return user info (no password_hash); access_role drives redirect (admin vs private)
    const accessRole = (user as { access_role?: string }).access_role ?? 'admin'

    // Record private user sign-in for analytics (fire-and-forget)
    if (accessRole === 'private') {
      void supabase.from('analytics_private_sign_ins').insert({ private_user_id: user.id }).then(() => {})
    }

    try {
      const cookie = createAuthCookie({
        sub: user.id,
        email: user.email,
        access_role: accessRole
      })
      const res = NextResponse.json({
        id: user.id,
        username: user.username,
        email: user.email,
        last_login: user.last_login,
        access_role: accessRole
      })
      res.headers.set('Set-Cookie', cookie)
      return res
    } catch (e) {
      console.warn('Auth cookie not set (AUTH_SECRET?):', e)
      const cookieErrorMessage =
        process.env.NODE_ENV === 'development'
          ? 'Add AUTH_SECRET to .env.local (min 16 chars), restart dev server, then sign in again to see private featured works.'
          : 'Sign-in could not be completed. Please try again later or contact the site administrator.'
      return NextResponse.json(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          last_login: user.last_login,
          access_role: accessRole,
          cookie_set: false,
          cookie_error: cookieErrorMessage
        },
        { status: 200 }
      )
    }

  } catch (err) {
    console.error('Error in admin auth:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
