import { createClient } from '@supabase/supabase-js'

export type PortfolioCoverImage = {
  id: string
  title: string
  source: 'selected-work' | 'field-note' | 'static'
  feature_image_url: string
  thumbnail_crop: {
    x: number
    y: number
    width: number
    height: number
    unit: string
  }
}

const DEFAULT_THUMBNAIL_CROP: PortfolioCoverImage['thumbnail_crop'] = {
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  unit: '%',
}

const SIGN_IN_STATIC_COVER_IMAGES: PortfolioCoverImage[] = [
  {
    id: 'catzilla',
    title: 'CatZilla',
    source: 'static',
    feature_image_url: '/LevinMedia-CatZilla.png',
    thumbnail_crop: DEFAULT_THUMBNAIL_CROP,
  },
  {
    id: 'david-levin',
    title: 'David Levin',
    source: 'static',
    feature_image_url: '/levin-about.png',
    thumbnail_crop: { x: 50, y: 18, width: 100, height: 100, unit: '%' },
  },
]

function shuffleCoverImages(images: PortfolioCoverImage[]): PortfolioCoverImage[] {
  const shuffled = [...images]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}

type CoverRow = {
  id: string
  title: string
  feature_image_url: string | null
  thumbnail_crop: PortfolioCoverImage['thumbnail_crop'] | null
  display_order?: number
  published_at?: string | null
}

function toCoverImage(
  row: CoverRow,
  source: PortfolioCoverImage['source'],
): PortfolioCoverImage | null {
  if (!row.feature_image_url?.trim()) return null

  const crop = row.thumbnail_crop ?? DEFAULT_THUMBNAIL_CROP

  return {
    id: row.id,
    title: row.title,
    source,
    feature_image_url: row.feature_image_url,
    thumbnail_crop: crop,
  }
}

/**
 * Public portfolio images for the sign-in cover mosaic (published, not private).
 */
export async function getPortfolioCoverImagesServer(): Promise<PortfolioCoverImage[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [worksResult, notesResult] = await Promise.all([
    supabase.rpc('prod_get_selected_works'),
    supabase.rpc('prod_get_field_notes'),
  ])

  const works = ((worksResult.data ?? []) as CoverRow[])
    .sort((a, b) => (b.display_order ?? 0) - (a.display_order ?? 0))
    .map((row) => toCoverImage(row, 'selected-work'))
    .filter((item): item is PortfolioCoverImage => item !== null)

  const notes = ((notesResult.data ?? []) as CoverRow[])
    .sort((a, b) => {
      const aTime = a.published_at ? Date.parse(a.published_at) : 0
      const bTime = b.published_at ? Date.parse(b.published_at) : 0
      return bTime - aTime
    })
    .map((row) => toCoverImage(row, 'field-note'))
    .filter((item): item is PortfolioCoverImage => item !== null)

  return shuffleCoverImages([...SIGN_IN_STATIC_COVER_IMAGES, ...works, ...notes])
}
