import { describe, expect, it } from 'vitest'
import {
  buildYouTubeMarkdown,
  extractYouTubeVideoId,
  findStandaloneYouTubeUrls,
  normalizeYouTubeEmbedsInMarkdown,
  youtubeEmbedUrl,
} from './youtube'
import { parseContentWithEmbeds } from './gallery-markdown'
import { sanitizeMarkdown } from './sanitize'

describe('extractYouTubeVideoId', () => {
  it('parses watch, short, embed, and youtu.be URLs', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
    expect(extractYouTubeVideoId('https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
  })

  it('rejects non-YouTube URLs', () => {
    expect(extractYouTubeVideoId('https://vimeo.com/123')).toBeNull()
    expect(extractYouTubeVideoId('https://example.com')).toBeNull()
  })
})

describe('findStandaloneYouTubeUrls', () => {
  it('finds bare URLs and markdown links on their own lines', () => {
    const content = [
      'Intro paragraph.',
      '',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      '',
      'More text with https://youtu.be/dQw4w9WgXcQ inline.',
      '',
      '[Watch](https://youtu.be/abcdefghijk)',
    ].join('\n')

    const found = findStandaloneYouTubeUrls(content)
    expect(found.map((f) => f.videoId)).toEqual(['dQw4w9WgXcQ', 'abcdefghijk'])
  })
})

describe('normalizeYouTubeEmbedsInMarkdown', () => {
  it('converts bare URLs, image markdown, and iframes into !youtube embeds', () => {
    expect(
      normalizeYouTubeEmbedsInMarkdown('https://youtu.be/dQw4w9WgXcQ'),
    ).toBe(buildYouTubeMarkdown('dQw4w9WgXcQ'))

    expect(
      normalizeYouTubeEmbedsInMarkdown('![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)'),
    ).toBe(buildYouTubeMarkdown('dQw4w9WgXcQ'))

    expect(
      normalizeYouTubeEmbedsInMarkdown(
        '<p>Hi</p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe><p>Bye</p>',
      ),
    ).toContain(buildYouTubeMarkdown('dQw4w9WgXcQ'))
  })
})

describe('sanitizeMarkdown youtube', () => {
  it('keeps YouTube embeds that would otherwise be stripped as iframes', () => {
    const saved = sanitizeMarkdown(
      'Before<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>After',
    )
    expect(saved).toContain('!youtube[YouTube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)')
    expect(saved).not.toContain('<iframe')
  })
})

describe('parseContentWithEmbeds youtube', () => {
  it('parses !youtube markdown and bare URLs', () => {
    const embed = buildYouTubeMarkdown('dQw4w9WgXcQ')
    expect(parseContentWithEmbeds(`Before\n\n${embed}\n\nAfter`)).toEqual([
      { type: 'markdown', content: 'Before\n\n' },
      { type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { type: 'markdown', content: '\n\nAfter' },
    ])

    expect(parseContentWithEmbeds('Before\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nAfter')).toEqual([
      { type: 'markdown', content: 'Before\n\n' },
      { type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { type: 'markdown', content: '\n\nAfter' },
    ])
  })

  it('builds privacy-enhanced embed URLs', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })
})
