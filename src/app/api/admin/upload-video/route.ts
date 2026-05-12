import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAllowedVideoMime, sanitizeVideoUploadFolder } from '@/lib/admin-video-upload'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Reject large bodies before buffering — large uploads must use POST /api/admin/upload-video/init + client upload. */
const MAX_INLINE_BYTES = 8 * 1024 * 1024

/**
 * Legacy path: small videos only (full body goes through this server).
 * Prefer `/api/admin/upload-video/init` + browser `uploadToSignedUrl` for files over a few MB.
 */
export async function POST(request: NextRequest) {
  try {
    const len = request.headers.get('content-length')
    if (len) {
      const n = parseInt(len, 10)
      if (!Number.isNaN(n) && n > MAX_INLINE_BYTES) {
        return NextResponse.json(
          {
            error:
              'This upload is too large for the legacy endpoint. Refresh the editor page, then upload again (large files go directly to storage).',
            code: 'USE_SIGNED_UPLOAD',
          },
          { status: 413 },
        )
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = sanitizeVideoUploadFolder(formData.get('folder') as string)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!isAllowedVideoMime(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a video file.' }, { status: 400 })
    }

    if (file.size > MAX_INLINE_BYTES) {
      return NextResponse.json(
        {
          error: 'File too large. Refresh the page and use the updated uploader.',
          code: 'USE_SIGNED_UPLOAD',
        },
        { status: 413 },
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`📹 (inline) Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    const { error } = await supabase.storage.from('media').upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error('Error uploading video:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath)

    console.log(`✅ Video uploaded successfully: ${urlData.publicUrl}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Error in video upload API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
