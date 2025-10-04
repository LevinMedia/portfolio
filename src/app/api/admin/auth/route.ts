import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from database
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Return user info (without password hash)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      last_login: user.last_login
    })

  } catch (err) {
    console.error('Error in admin auth:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
