export type GalleryImage = {
  url: string
  caption?: string
}

export type ContentPart =
  | { type: 'markdown'; content: string }
  | { type: 'video'; content: string; alt?: string }
  | { type: 'gallery'; images: GalleryImage[]; caption?: string }

/** Legacy: separates URL from per-image caption within a pipe-delimited segment. */
const FIELD_SEP = '\x1f'

const VIDEO_REGEX = /!video\[([^\]]*)\]\(([^)]+)\)/g
const BASE64_PAYLOAD_REGEX = /^[A-Za-z0-9+/=_-]+$/

function encodeBase64Utf8(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf-8').toString('base64')
  }
  return btoa(unescape(encodeURIComponent(text)))
}

function decodeBase64Utf8(payload: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(payload, 'base64').toString('utf-8')
  }
  return decodeURIComponent(escape(atob(payload)))
}

function decodeJsonGalleryPayload(payload: string): GalleryImage[] | null {
  if (!BASE64_PAYLOAD_REGEX.test(payload)) return null
  try {
    const parsed = JSON.parse(decodeBase64Utf8(payload)) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed
      .filter((item): item is GalleryImage => {
        return !!item && typeof item === 'object' && typeof (item as GalleryImage).url === 'string'
      })
      .map((item) => ({
        url: item.url,
        caption: item.caption?.trim() || undefined,
      }))
  } catch {
    return null
  }
}

/** Legacy pipe-delimited payload (url or url + unit-separator + caption). */
export function parseGalleryPayload(payload: string): GalleryImage[] {
  return payload
    .split('|')
    .filter(Boolean)
    .map((segment) => {
      const sepIndex = segment.indexOf(FIELD_SEP)
      if (sepIndex === -1) {
        return { url: segment.trim() }
      }
      const url = segment.slice(0, sepIndex).trim()
      const caption = segment.slice(sepIndex + 1).trim()
      return { url, caption: caption || undefined }
    })
}

function parseGalleryPayloadAuto(payload: string): GalleryImage[] {
  const jsonImages = decodeJsonGalleryPayload(payload.trim())
  if (jsonImages && jsonImages.length > 0) return jsonImages
  return parseGalleryPayload(payload)
}

export function buildGalleryPayload(images: GalleryImage[]): string {
  return encodeBase64Utf8(JSON.stringify(images))
}

export function buildGalleryMarkdown(galleryCaption: string, images: GalleryImage[]): string {
  return `!gallery[${galleryCaption}](${buildGalleryPayload(images)})`
}

type GalleryMatch = {
  raw: string
  caption: string
  images: GalleryImage[]
  index: number
}

/** Scan content for gallery embeds; supports base64 JSON and legacy pipe payloads (incl. captions with parentheses). */
export function findGalleryEmbedsInContent(content: string): GalleryMatch[] {
  const results: GalleryMatch[] = []
  let searchFrom = 0

  while (searchFrom < content.length) {
    const start = content.indexOf('!gallery[', searchFrom)
    if (start === -1) break

    const titleStart = start + '!gallery['.length
    const titleEnd = content.indexOf('](', titleStart)
    if (titleEnd === -1) break

    const caption = content.slice(titleStart, titleEnd)
    const payloadStart = titleEnd + 2

    const lineBreak = content.indexOf('\n', payloadStart)
    const segmentEnd = lineBreak === -1 ? content.length : lineBreak
    const segment = content.slice(payloadStart, segmentEnd)

    if (!segment.endsWith(')')) {
      searchFrom = start + 1
      continue
    }

    const payload = segment.slice(0, -1)
    const raw = content.slice(start, segmentEnd)
    const images = parseGalleryPayloadAuto(payload)

    if (images.length > 0) {
      results.push({ raw, caption, images, index: start })
    }

    searchFrom = segmentEnd
  }

  return results
}

export function parseGalleryMarkdown(text: string): {
  caption: string
  images: GalleryImage[]
  raw: string
} | null {
  const trimmed = text.trim()
  const matches = findGalleryEmbedsInContent(trimmed)
  if (matches.length !== 1 || matches[0].index !== 0 || matches[0].raw.length !== trimmed.length) {
    return null
  }
  const match = matches[0]
  return {
    raw: match.raw,
    caption: match.caption,
    images: match.images,
  }
}

export function findAllGalleriesInContent(content: string): GalleryMatch[] {
  return findGalleryEmbedsInContent(content)
}

export function parseContentWithEmbeds(content: string): ContentPart[] {
  const matches: Array<{ index: number; length: number; part: ContentPart }> = []

  let videoMatch: RegExpExecArray | null
  while ((videoMatch = VIDEO_REGEX.exec(content)) !== null) {
    matches.push({
      index: videoMatch.index,
      length: videoMatch[0].length,
      part: {
        type: 'video',
        content: videoMatch[2],
        alt: videoMatch[1],
      },
    })
  }

  for (const gallery of findGalleryEmbedsInContent(content)) {
    matches.push({
      index: gallery.index,
      length: gallery.raw.length,
      part: {
        type: 'gallery',
        images: gallery.images,
        caption: gallery.caption || undefined,
      },
    })
  }

  matches.sort((a, b) => a.index - b.index)

  const parts: ContentPart[] = []
  let lastIndex = 0

  for (const item of matches) {
    if (item.index > lastIndex) {
      parts.push({ type: 'markdown', content: content.substring(lastIndex, item.index) })
    }
    parts.push(item.part)
    lastIndex = item.index + item.length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.substring(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'markdown', content }]
}
