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
  // Map admin vertical alignment to explicit Y percentages; X stays centered.
  const verticalAlign = (() => {
    const align = (note.og_vertical_align || 'center').toLowerCase()
    if (align === 'top') return '20%'    // bias upward
    if (align === 'bottom') return '80%' // bias downward
    return '50%' // center
  })()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 50%', // lock X to center
          backgroundPositionX: '50%',
          backgroundPositionY: verticalAlign, // only Y moves based on setting
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


