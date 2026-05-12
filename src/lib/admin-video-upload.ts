/** Allowed video MIME types for admin uploads (must match storage + player). */
export const ADMIN_VIDEO_ALLOWED_MIME = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
  'video/x-flv',
] as const

/** Max size for direct browser → Supabase upload (bucket / plan limits may be lower). */
export const ADMIN_VIDEO_MAX_BYTES = 500 * 1024 * 1024

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/mpeg': 'mpeg',
  'video/3gpp': '3gp',
  'video/x-flv': 'flv',
}

const ALLOWED_FOLDERS = new Set(['selected-works-videos', 'field-notes-videos'])

export function sanitizeVideoUploadFolder(raw: unknown): string {
  if (typeof raw !== 'string' || !ALLOWED_FOLDERS.has(raw)) {
    return 'selected-works-videos'
  }
  return raw
}

export function isAllowedVideoMime(contentType: string): boolean {
  return (ADMIN_VIDEO_ALLOWED_MIME as readonly string[]).includes(contentType)
}

/** Prefer extension from MIME; fall back to sanitized client name. */
export function safeVideoExtension(contentType: string, fileName: string): string | null {
  const fromMime = EXT_BY_MIME[contentType]
  if (fromMime) return fromMime
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext && /^[a-z0-9]{2,5}$/.test(ext)) return ext
  return null
}
