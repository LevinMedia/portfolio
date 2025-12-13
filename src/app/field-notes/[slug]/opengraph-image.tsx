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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
        }}
      >
        <img
          src={note.feature_image_url}
          alt={note.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  )
}


