/** YouTube video IDs are 11 characters: letters, digits, underscore, hyphen. */
const YOUTUBE_ID_RE = /^[\w-]{11}$/

/** Stable markdown embed — survives Milkdown round-trips (same idea as !video). */
export const YOUTUBE_MARKDOWN_RE = /!youtube\[([^\]]*)\]\(([^)]+)\)/g

function isYouTubeVideoId(id: string | undefined | null): id is string {
  return !!id && YOUTUBE_ID_RE.test(id)
}

/**
 * Extract an 11-char YouTube video id from common URL shapes.
 * Supports watch, youtu.be, shorts, embed, live, and v/ paths.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim().replace(/[),.;]+$/g, '')
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]?.split('?')[0]
    return isYouTubeVideoId(id) ? id : null
  }

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const fromQuery = url.searchParams.get('v')
    if (isYouTubeVideoId(fromQuery)) return fromQuery

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      const id = parts[1].split('?')[0]
      return isYouTubeVideoId(id) ? id : null
    }
  }

  return null
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

export function buildYouTubeMarkdown(videoId: string, title = 'YouTube'): string {
  return `!youtube[${title}](${youtubeWatchUrl(videoId)})`
}

export type StandaloneYouTubeMatch = {
  index: number
  length: number
  videoId: string
}

/**
 * Find lines that are only a YouTube URL (or a markdown link/image to one).
 * Mid-sentence links and existing !youtube embeds are left alone.
 */
export function findStandaloneYouTubeUrls(content: string): StandaloneYouTubeMatch[] {
  const results: StandaloneYouTubeMatch[] = []
  const lineRegex = /(^|\n)([^\n]*)/g
  let match: RegExpExecArray | null

  while ((match = lineRegex.exec(content)) !== null) {
    const prefix = match[1]
    const line = match[2]
    const lineStart = match.index + prefix.length
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^!youtube\[/.test(trimmed)) continue

    let candidate = trimmed
    const mdImage = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    const mdLink = trimmed.match(/^\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (mdImage) {
      candidate = mdImage[2]
    } else if (mdLink) {
      candidate = mdLink[2]
    } else if (
      !/^https?:\/\//i.test(trimmed) &&
      !/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed)
    ) {
      continue
    }

    const videoId = extractYouTubeVideoId(candidate)
    if (!videoId) continue

    results.push({
      index: lineStart,
      length: line.length,
      videoId,
    })
  }

  return results
}

/**
 * Normalize YouTube pastes into `!youtube[YouTube](watchUrl)` so they survive
 * the editor + HTML sanitizer (Crepe may turn pastes into images/iframes).
 */
export function normalizeYouTubeEmbedsInMarkdown(content: string): string {
  if (!content) return content

  let next = content

  // Recover iframes the sanitizer would otherwise strip entirely
  next = next.replace(
    /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>/gi,
    (full, src: string) => {
      const id = extractYouTubeVideoId(src)
      return id ? `\n\n${buildYouTubeMarkdown(id)}\n\n` : full
    },
  )

  // Anchor-only lines pointing at YouTube
  next = next.replace(
    /(?:^|\n)\s*<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>\s*[^<]*<\/a>\s*(?=\n|$)/gi,
    (full, href: string) => {
      const id = extractYouTubeVideoId(href)
      if (!id) return full
      const leadingNl = full.startsWith('\n') ? '\n' : ''
      return `${leadingNl}${buildYouTubeMarkdown(id)}`
    },
  )

  // Rewrite bare URL / link / image lines in place (preserve surrounding newlines)
  const lines = next.split('\n')
  const rewritten = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed || /^!youtube\[/.test(trimmed)) return line

    let candidate = trimmed
    const mdImage = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    const mdLink = trimmed.match(/^\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (mdImage) candidate = mdImage[2]
    else if (mdLink) candidate = mdLink[2]
    else if (
      !/^https?:\/\//i.test(trimmed) &&
      !/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed)
    ) {
      return line
    }

    const videoId = extractYouTubeVideoId(candidate)
    if (!videoId) return line

    const indent = line.match(/^\s*/)?.[0] ?? ''
    return `${indent}${buildYouTubeMarkdown(videoId)}`
  })

  return rewritten.join('\n')
}
