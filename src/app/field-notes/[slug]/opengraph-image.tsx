import { ImageResponse } from 'next/og'
import { getFieldNoteBySlug } from './data'

export const runtime = 'nodejs'
export const alt = 'Field note'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 675, // 16:9 to match common OG previews
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const note = await getFieldNoteBySlug(slug)

  if (!note) {
    return new Response('Not found', { status: 404 })
  }

  const backgroundImage = note.feature_image_url
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 50%', // lock to center to avoid tiling/splitting
          backgroundPositionX: '50%',
          backgroundPositionY: '50%', // temporarily ignore vertical alignment setting
          backgroundRepeat: 'no-repeat'
        }}
      />
    ),
    {
      width: size.width,
      height: size.height,
    }
  )
}


