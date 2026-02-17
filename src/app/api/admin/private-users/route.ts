import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getAuthCookiePayload } from '@/lib/auth-cookie'

/** Returns auth payload if the request is from an admin; otherwise null. */
async function requireAdmin() {
  const payload = await getAuthCookiePayload()
  return payload?.access_role === 'admin' ? payload : null
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, username, is_active, created_at, last_login')
      .eq('access_role', 'private')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching private users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Error in private-users GET:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailTrimmed = String(email).trim().toLowerCase()
    if (!emailTrimmed) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', emailTrimmed)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const username = emailTrimmed

    const { data: user, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password_hash: hashedPassword,
        email: emailTrimmed,
        is_active: true,
        access_role: 'private',
      })
      .select('id, email, username, is_active, created_at')
      .single()

    if (error) {
      console.error('Error creating private user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('Error in private-users POST:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, newPassword } = await request.json()
    if (!id || !newPassword) {
      return NextResponse.json(
        { error: 'User id and new password are required' },
        { status: 400 }
      )
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, access_role')
      .eq('id', id)
      .single()

    if (fetchError || !user || (user as { access_role?: string }).access_role !== 'private') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in private-users PATCH:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, access_role')
      .eq('id', id)
      .single()

    if (fetchError || !user || (user as { access_role?: string }).access_role !== 'private') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in private-users DELETE:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
