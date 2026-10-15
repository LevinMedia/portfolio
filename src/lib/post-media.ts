import { parseContentWithEmbeds, type ContentPart } from './gallery-markdown'

export type PostSlide = {
  kind: 'image' | 'video' | 'youtube'
  url?: string
  videoId?: string
  caption?: string
}

export type IndexedPart = ContentPart & { mediaStart: number }

const MARKDOWN_IMAGE_RE =
  /!\[([^\]]*)\]\(\s*(<[^>\s]+>|[^)\s]+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/g

/** Upload writes this into the brackets when no caption was set. */
const VIDEO_CAPTION_PLACEHOLDER = 'Video'

/** Caption stored in `!video[caption](url)`. The upload placeholder is not a caption. */
export function videoDisplayCaption(alt: string | null | undefined): string | undefined {
  const caption = alt?.trim()
  if (!caption || caption === VIDEO_CAPTION_PLACEHOLDER) return undefined
  return caption
}

/** Images in a markdown chunk, in reading order. Caption is the image title from the caption control. */
export function findMarkdownImages(markdown: string): Array<{ url: string; caption?: string }> {
  const source = markdown.replace(/```[\s\S]*?```/g, '')
  const images: Array<{ url: string; caption?: string }> = []
  const pattern = new RegExp(MARKDOWN_IMAGE_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    const rawUrl = match[2] ?? ''
    const url = rawUrl.replace(/^<|>$/g, '')
    const title = (match[3] ?? match[4] ?? '').trim()
    if (!url) continue
    images.push({ url, caption: title || undefined })
  }
  return images
}

/** Every gallery image, standalone image, video, and YouTube embed in document order. */
export function indexPostMedia(content: string): { parts: IndexedPart[]; media: PostSlide[] } {
  const media: PostSlide[] = []
  const parts = parseContentWithEmbeds(content).map((part) => {
    const mediaStart = media.length
    if (part.type === 'video') {
      media.push({
        kind: 'video',
        url: part.content,
        caption: videoDisplayCaption(part.alt),
      })
    } else if (part.type === 'youtube') {
      media.push({ kind: 'youtube', videoId: part.videoId })
    } else if (part.type === 'gallery') {
      for (const image of part.images) {
        media.push({ kind: 'image', url: image.url, caption: image.caption })
      }
    } else {
      for (const image of findMarkdownImages(part.content)) {
        media.push({ kind: 'image', url: image.url, caption: image.caption })
      }
    }
    return { ...part, mediaStart }
  })

  return { parts, media }
}
