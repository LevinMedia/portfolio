import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload, hasPrivateAccess } from '@/lib/auth-cookie'

export interface SelectedWork {
  id: string
  title: string
  slug: string
  content: string
  feature_image_url: string
  published_at: string
  og_vertical_align?: 'top' | 'center' | 'bottom'
  is_private?: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getSelectedWorkBySlug(slug: string): Promise<SelectedWork | null> {
  const { data, error } = await supabase.rpc('prod_get_selected_work_by_slug', {
    p_slug: slug
  })

  if (error) {
    console.error('Error fetching selected work:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  const work = data[0] as SelectedWork
  if (work.is_private) {
    const payload = await getAuthCookiePayload()
    if (!payload || !hasPrivateAccess(payload.access_role)) {
      return null
    }
  }

  return work
}
