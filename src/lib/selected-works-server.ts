import { createClient } from '@supabase/supabase-js'
import { getAuthCookiePayload, hasPrivateAccess } from '@/lib/auth-cookie'

export interface SelectedWorkServer {
  id: string
  title: string
  slug: string
  feature_image_url: string
  thumbnail_crop: { x: number; y: number; width: number; height: number; unit: string }
  display_order: number
}

/**
 * Fetch selected works on the server (SSR). Reads auth cookie and returns
 * public + private works when the user has private access; otherwise public only.
 * Used by the home page so the list is server-rendered, no client fetch.
 */
export async function getSelectedWorksServer(): Promise<SelectedWorkServer[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let includePrivate = false
  try {
    const payload = await getAuthCookiePayload()
    if (payload && hasPrivateAccess(payload.access_role)) includePrivate = true
  } catch {
    // no cookie or invalid: public only
  }

  const rpc = includePrivate ? 'prod_get_selected_works_include_private' : 'prod_get_selected_works'
  let result = await supabase.rpc(rpc)

  if (result.error && includePrivate) {
    result = await supabase.rpc('prod_get_selected_works')
  }

  if (result.error) return []

  const data = (result.data ?? []) as SelectedWorkServer[]
  return data.sort((a, b) => b.display_order - a.display_order)
}
