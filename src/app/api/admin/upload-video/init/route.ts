import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload, hasPrivateAccess } from '@/lib/auth-cookie'
import {
  ADMIN_VIDEO_MAX_BYTES,
  isAllowedVideoMime,
  safeVideoExtension,
  sanitizeVideoUploadFolder,
} from '@/lib/admin-video-upload'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Returns a signed-upload token so the browser can upload large videos directly to Supabase
 * (bypasses Vercel / Next.js request body limits).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthCookiePayload()
    if (!auth || !hasPrivateAccess(auth.access_role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      folder?: string
      fileName?: string
      contentType?: string
      fileSize?: number
    }

    const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : ''
    const fileName = typeof body.fileName === 'string' ? body.fileName : 'video'
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : 0

    if (!contentType || !isAllowedVideoMime(contentType)) {
      return NextResponse.json({ error: 'Invalid or missing video content type.' }, { status: 400 })
    }

    if (fileSize > 0 && fileSize > ADMIN_VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: `Video must be under ${Math.floor(ADMIN_VIDEO_MAX_BYTES / (1024 * 1024))} MB.` },
        { status: 400 },
      )
    }

    const ext = safeVideoExtension(contentType, fileName)
    if (!ext) {
      return NextResponse.json({ error: 'Could not determine a safe file extension.' }, { status: 400 })
    }

    const folder = sanitizeVideoUploadFolder(body.folder)
    const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(objectPath, {
      upsert: false,
    })

    if (error || !data) {
      console.error('createSignedUploadUrl:', error)
      return NextResponse.json({ error: error?.message ?? 'Could not create upload URL.' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(objectPath)

    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl: urlData.publicUrl,
    })
  } catch (e) {
    console.error('upload-video/init:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
