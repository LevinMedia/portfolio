import { describe, expect, it } from 'vitest'
import {
  buildGalleryMarkdown,
  findGalleryEmbedsInContent,
  parseContentWithEmbeds,
} from './gallery-markdown'

describe('gallery-markdown', () => {
  it('round-trips captions containing parentheses via base64 payload', () => {
    const images = [
      {
        url: 'https://example.com/a.png',
        caption: 'Reference data from a relate object (Quotas) to generate values.',
      },
      { url: 'https://example.com/b.png', caption: 'Second image' },
    ]
    const markdown = buildGalleryMarkdown('Gallery', images)
    const found = findGalleryEmbedsInContent(markdown)

    expect(found).toHaveLength(1)
    expect(found[0].images).toEqual(images)
  })

  it('parses legacy pipe payloads with parentheses in captions', () => {
    const url1 = 'https://example.com/a.png'
    const url2 = 'https://example.com/b.png'
    const cap1 = 'Uses relate object (Quotas) for values'
    const markdown = `!gallery[Gallery](${url1}\x1f${cap1}|${url2})`

    const parts = parseContentWithEmbeds(markdown)
    expect(parts).toHaveLength(1)
    expect(parts[0].type).toBe('gallery')
    if (parts[0].type === 'gallery') {
      expect(parts[0].images[0].caption).toBe(cap1)
      expect(parts[0].images[1].url).toBe(url2)
    }
  })
})
