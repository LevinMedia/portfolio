import { createDrawerListCache } from '@/lib/drawer-list-cache'

export type SelectedWorkListItem = {
  id: string
  title: string
  slug: string
  feature_image_url: string
  thumbnail_crop: {
    x: number
    y: number
    width: number
    height: number
    unit: string
  }
  display_order: number
}

const selectedWorksCache = createDrawerListCache<SelectedWorkListItem[]>()

export function getSelectedWorksCache() {
  return selectedWorksCache
}

/** Drop cached featured-work tiles (e.g. on sign-out so private entries are not retained). */
export function clearSelectedWorksCache(): void {
  selectedWorksCache.clear()
}
