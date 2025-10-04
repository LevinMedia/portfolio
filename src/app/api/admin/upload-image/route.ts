import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'images'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Error in image upload API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
