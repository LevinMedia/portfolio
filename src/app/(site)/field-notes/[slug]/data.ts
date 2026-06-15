import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload, hasPrivateAccess } from '@/lib/auth-cookie'

export interface FieldNote {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
  author: string
  og_vertical_align?: 'top' | 'center' | 'bottom'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getFieldNoteBySlug(slug: string): Promise<FieldNote | null> {
  const { data, error } = await supabase.rpc('prod_get_field_note_by_slug', {
    p_slug: slug
  })

  if (error) {
    console.error('Error fetching field note:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  const note = data[0] as FieldNote & { is_private?: boolean }
  if (note.is_private) {
    const payload = await getAuthCookiePayload()
    if (!payload || !hasPrivateAccess(payload.access_role)) {
      return null
    }
  }

  const { is_private, ...noteForClient } = note
  void is_private
  return noteForClient
}
