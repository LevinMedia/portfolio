import { ImageResponse } from 'next/og'
import { getSelectedWorkBySlug } from './data'

export const runtime = 'nodejs'
export const alt = 'Selected work'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 675,
}

function buildAllowedImageHosts(): Set<string> {
  const hosts = new Set<string>()

  const fromEnv = process.env.OG_ALLOWED_IMAGE_HOSTS
  if (fromEnv) {
    for (const raw of fromEnv.split(',')) {
      const host = raw.trim().toLowerCase()
      if (host) hosts.add(host)
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname.toLowerCase())
    } catch {
      // ignore invalid env values
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      hosts.add(new URL(supabaseUrl).hostname.toLowerCase())
    } catch {
      // ignore invalid env values
    }
  }

  return hosts
}

function normalizeAndValidateOgImageUrl(raw: string): string | null {
  const allowedHosts = buildAllowedImageHosts()
  if (allowedHosts.size === 0) return null

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'https:' && protocol !== 'http:') return null

  const host = parsed.hostname.toLowerCase()
  return allowedHosts.has(host) ? parsed.toString() : null
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const work = await getSelectedWorkBySlug(slug)

  if (!work) {
    return new Response('Not found', { status: 404 })
  }

  const safeImageUrl = normalizeAndValidateOgImageUrl(work.feature_image_url)
  if (!safeImageUrl) {
    return new Response('Invalid OG image URL', { status: 400 })
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
          src={safeImageUrl}
          alt={work.title}
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
