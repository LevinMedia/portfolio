import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', 'Admin')
      .single()

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' })
    }

    // Hash the password from environment variable
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'TheLetterA!'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Create admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: process.env.DEFAULT_ADMIN_USERNAME || 'Admin',
        password_hash: hashedPassword,
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@levinmedia.com',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      user: {
        id: data.id,
        username: data.username,
        email: data.email
      }
    })

  } catch (err) {
    console.error('Error in admin setup:', err)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
