import { describe, expect, it } from 'vitest'
import { buildGalleryMarkdown } from './gallery-markdown'
import { findMarkdownImages, indexPostMedia, videoDisplayCaption } from './post-media'

describe('findMarkdownImages', () => {
  it('reads the caption control text and ignores the ratio alt', () => {
    const markdown = [
      '![1.00](https://cdn.example/a.png "Hello caption")',
      '![1.00 borderless](https://cdn.example/b.png "Edge")',
      '![a photo](https://cdn.example/c.jpg)',
    ].join('\n\n')

    expect(findMarkdownImages(markdown)).toEqual([
      { url: 'https://cdn.example/a.png', caption: 'Hello caption' },
      { url: 'https://cdn.example/b.png', caption: 'Edge' },
      { url: 'https://cdn.example/c.jpg', caption: undefined },
    ])
  })
})

describe('videoDisplayCaption', () => {
  it('uses the bracket text and drops the upload placeholder', () => {
    expect(videoDisplayCaption('Walkthrough of the demo')).toBe('Walkthrough of the demo')
    expect(videoDisplayCaption('  spaced  ')).toBe('spaced')
    expect(videoDisplayCaption('Video')).toBeUndefined()
    expect(videoDisplayCaption('')).toBeUndefined()
    expect(videoDisplayCaption(undefined)).toBeUndefined()
  })
})

describe('indexPostMedia', () => {
  it('orders galleries, standalone images, and videos into one sequence', () => {
    const gallery = buildGalleryMarkdown('Set', [
      { url: 'https://cdn.example/g1.png', caption: 'One' },
      { url: 'https://cdn.example/g2.png', caption: 'Two' },
    ])
    const content = [
      gallery,
      '',
      '![1.00](https://cdn.example/solo.png "Under the image")',
      '',
      '!video[Walkthrough](https://cdn.example/clip.mp4)',
      '',
      '!youtube[Demo](https://www.youtube.com/watch?v=dQw4w9wgxcQ)',
    ].join('\n')

    const { media, parts } = indexPostMedia(content)
    expect(media.map((item) => item.kind)).toEqual(['image', 'image', 'image', 'video', 'youtube'])
    expect(media[2]).toMatchObject({ url: 'https://cdn.example/solo.png', caption: 'Under the image' })
    expect(media[3]).toMatchObject({ kind: 'video', caption: 'Walkthrough' })
    expect(media[4]).toMatchObject({ kind: 'youtube', videoId: 'dQw4w9wgxcQ' })

    const galleryPart = parts.find((part) => part.type === 'gallery')
    const markdownPart = parts.find((part) => part.type === 'markdown' && part.content.includes('solo.png'))
    expect(galleryPart?.mediaStart).toBe(0)
    expect(markdownPart?.mediaStart).toBe(2)
  })
})
