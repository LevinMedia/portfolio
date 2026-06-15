import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getAuthCookiePayload } from '@/lib/auth-cookie'
import { displayPrivateAccessLabel, makePrivateAccessIdentity } from '@/lib/private-access'

/** Returns auth payload if the request is from an admin; otherwise null. */
async function requireAdmin() {
  const payload = await getAuthCookiePayload()
  return payload?.access_role === 'admin' ? payload : null
}

async function passwordInUse(
  supabase: SupabaseClient,
  password: string,
  excludeUserId?: string,
): Promise<boolean> {
  const { data: users } = await supabase
    .from('admin_users')
    .select('id, password_hash')
    .eq('access_role', 'private')

  for (const user of users ?? []) {
    if (excludeUserId && user.id === excludeUserId) continue
    const hash = (user as { password_hash?: string }).password_hash
    if (hash && (await bcrypt.compare(password, hash))) {
      return true
    }
  }
  return false
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, username, label, is_active, created_at, last_login')
      .eq('access_role', 'private')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching password access entries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = (data ?? []).map((user) => ({
      ...user,
      label: displayPrivateAccessLabel(user),
    }))

    return NextResponse.json(users)
  } catch (err) {
    console.error('Error in private-users GET:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { label, password } = await request.json()

    if (!label || !password) {
      return NextResponse.json({ error: 'Label and password are required' }, { status: 400 })
    }

    const labelTrimmed = String(label).trim()
    if (!labelTrimmed) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    if (await passwordInUse(supabase, password)) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose a unique password.' },
        { status: 409 },
      )
    }

    const { username, email } = makePrivateAccessIdentity(labelTrimmed)
    const hashedPassword = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password_hash: hashedPassword,
        email,
        label: labelTrimmed,
        is_active: true,
        access_role: 'private',
      })
      .select('id, email, username, label, is_active, created_at')
      .single()

    if (error) {
      console.error('Error creating password access entry:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ...user,
      label: displayPrivateAccessLabel(user),
    })
  } catch (err) {
    console.error('Error in private-users POST:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
        { error: 'Entry id and new password are required' },
        { status: 400 },
      )
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, access_role')
      .eq('id', id)
      .single()

    if (fetchError || !user || (user as { access_role?: string }).access_role !== 'private') {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (await passwordInUse(supabase, newPassword, id)) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose a unique password.' },
        { status: 409 },
      )
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Entry id is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, access_role')
      .eq('id', id)
      .single()

    if (fetchError || !user || (user as { access_role?: string }).access_role !== 'private') {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase.from('admin_users').delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting password access entry:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in private-users DELETE:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
