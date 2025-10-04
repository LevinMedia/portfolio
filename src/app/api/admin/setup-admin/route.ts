import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Missing Supabase URL configuration' }, { status: 500 })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Missing Supabase service role key' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // First, let's run the database schema setup
    console.log('Setting up database schema...')
    
    // Hash the default password from environment variable
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'TheLetterA!'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    console.log('Generated password hash for Admin user')

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', 'Admin')
      .single()

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        adminUser: {
          username: 'Admin',
          email: 'admin@levinmedia.com'
        }
      })
    }

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

    console.log('Admin user created successfully:', data.username)

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      adminUser: {
        id: data.id,
        username: data.username,
        email: data.email,
        is_active: data.is_active
      },
      loginCredentials: {
        username: process.env.DEFAULT_ADMIN_USERNAME || 'Admin',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'TheLetterA!'
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
