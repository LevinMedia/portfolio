import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getAuthCookiePayload } from '@/lib/auth-cookie'
import { displayPrivateAccessLabel, makePrivateAccessIdentity } from '@/lib/private-access'
import { sanitizeMarkdown, sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import { normalizeLiteralHtmlBreaksInMarkdown } from '@/lib/markdown-normalize'

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

type PrivateUserRow = {
  id: string
  email?: string | null
  username?: string | null
  label?: string | null
  is_active?: boolean | null
  created_at?: string | null
  last_login?: string | null
  index_enabled?: boolean | null
  index_title?: string | null
  index_content?: string | null
  index_logo_url?: string | null
  index_header_title?: string | null
}

const LIST_COLUMNS = 'id, email, username, label, is_active, created_at, last_login'

/** List shape; never includes password_hash. Index columns may be absent before the migration runs. */
function toListEntry(user: PrivateUserRow) {
  return {
    id: user.id,
    email: user.email ?? '',
    username: user.username ?? '',
    label: displayPrivateAccessLabel(user),
    is_active: user.is_active ?? true,
    created_at: user.created_at ?? null,
    last_login: user.last_login ?? null,
    index_enabled: user.index_enabled === true,
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const id = new URL(request.url).searchParams.get('id')
    if (id) {
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .eq('access_role', 'private')
        .maybeSingle()

      if (userError) {
        console.error('Error fetching password access entry:', userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
      if (!user) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }

      const row = user as PrivateUserRow
      return NextResponse.json({
        ...toListEntry(row),
        index_title: row.index_title ?? '',
        index_content: row.index_content ?? '',
        index_logo_url: row.index_logo_url ?? '',
        index_header_title: row.index_header_title ?? '',
      })
    }

    const list = (columns: string) =>
      supabase
        .from('admin_users')
        .select(columns)
        .eq('access_role', 'private')
        .order('created_at', { ascending: false })

    let { data, error } = await list(`${LIST_COLUMNS}, index_enabled`)
    // Before the Index migration runs the column is missing; list without it.
    if (error && /index_enabled/.test(error.message)) {
      ;({ data, error } = await list(LIST_COLUMNS))
    }

    if (error) {
      console.error('Error fetching password access entries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(((data ?? []) as unknown as PrivateUserRow[]).map(toListEntry))
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

    return NextResponse.json(toListEntry(user as PrivateUserRow))
  } catch (err) {
    console.error('Error in private-users POST:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Save the optional bespoke Index page for a password-access entry. */
async function updateIndex(id: string, index: Record<string, unknown>) {
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

  const enabled = index.enabled === true
  const title = sanitizeText(typeof index.title === 'string' ? index.title : '')
  const content = sanitizeMarkdown(
    normalizeLiteralHtmlBreaksInMarkdown(typeof index.content === 'string' ? index.content : ''),
  )
  const headerTitle = sanitizeText(typeof index.header_title === 'string' ? index.header_title : '')
  const logoUrl = sanitizeUrl(typeof index.logo_url === 'string' ? index.logo_url : '')

  if (enabled && !content.trim()) {
    return NextResponse.json(
      { error: 'Add some content before turning the Index on' },
      { status: 400 },
    )
  }

  const { error: updateError } = await supabase
    .from('admin_users')
    .update({
      index_enabled: enabled,
      index_title: title || null,
      index_content: content || null,
      index_logo_url: logoUrl || null,
      index_header_title: headerTitle || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('Error updating password access index:', updateError)
    const missingColumn = /index_(enabled|title|content|logo_url|header_title)/.test(updateError.message)
    return NextResponse.json(
      {
        error: missingColumn
          ? 'Index columns are missing. Run db/migrations/2026_10_10_private_access_index.sql in Supabase first.'
          : updateError.message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, newPassword } = body
    if (id && body.index && typeof body.index === 'object') {
      if (newPassword) {
        return NextResponse.json(
          { error: 'Update the Index and the password in separate requests' },
          { status: 400 },
        )
      }
      return updateIndex(String(id), body.index as Record<string, unknown>)
    }
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
