import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Check if setup is already completed
    const { data: isCompleted, error: checkError } = await supabase.rpc('prod_is_setup_completed')
    
    if (checkError) {
      console.error('Error checking setup status:', checkError)
      return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 })
    }

    // Check if any admin users exist
    const { data: adminUsers, error: usersError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('Error checking admin users:', usersError)
      return NextResponse.json({ error: 'Failed to check admin users' }, { status: 500 })
    }

    const hasAdminUsers = adminUsers && adminUsers.length > 0
    const setupCompleted = isCompleted || hasAdminUsers

    return NextResponse.json({ 
      setupCompleted,
      canSetup: !setupCompleted,
      hasAdminUsers
    })
  } catch (err) {
    console.error('Error in secure setup check:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Check if setup is already completed
    const { data: isCompleted, error: checkError } = await supabase.rpc('prod_is_setup_completed')
    
    if (checkError) {
      console.error('Error checking setup status:', checkError)
      return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 })
    }

    if (isCompleted) {
      return NextResponse.json({ error: 'Setup has already been completed' }, { status: 403 })
    }

    // Check if any admin users exist
    const { data: existingUsers, error: usersError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('Error checking existing users:', usersError)
      return NextResponse.json({ error: 'Failed to check existing users' }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Admin user already exists' }, { status: 403 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12) // Higher salt rounds for security

    // Create admin user
    const { data: adminUser, error: createError } = await supabase
      .from('admin_users')
      .insert({
        username: 'Admin',
        password_hash: hashedPassword,
        email: email,
        is_active: true
      })
      .select('id, username, email, is_active')
      .single()

    if (createError) {
      console.error('Error creating admin user:', createError)
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
    }

    // Mark setup as completed
    const { error: markError } = await supabase.rpc('prod_mark_setup_completed')
    
    if (markError) {
      console.error('Error marking setup as completed:', markError)
      // Don't fail the request, but log the error
      console.warn('Setup completed but could not mark as completed in database')
    }

    // Return success (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        is_active: adminUser.is_active
      }
    })

  } catch (err) {
    console.error('Error in secure setup:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
