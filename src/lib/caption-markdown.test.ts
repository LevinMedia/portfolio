import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { describe, expect, it } from 'vitest'
import { CAPTION_MARKER, CAPTION_TAG, remarkCaption, remarkCaptionNode, stringifyCaption } from './caption-markdown'

describe('caption markdown', () => {
  it('keeps italic inside a caption and writes the marker back', async () => {
    const source = `${CAPTION_MARKER} Hello *there*`
    const file = await unified()
      .use(remarkParse)
      .use(remarkCaptionNode)
      .use(remarkStringify, {
        handlers: { caption: stringifyCaption },
      } as never)
      .process(source)

    const text = String(file)
    expect(text).toContain(CAPTION_MARKER)
    expect(text).toContain('*there*')
    expect(text.indexOf(CAPTION_MARKER)).toBe(0)
  })

  it('turns a caption into the public caption tag and keeps emphasis', async () => {
    const tree = await unified()
      .use(remarkParse)
      .use(remarkCaption)
      .run(unified().use(remarkParse).parse(`${CAPTION_MARKER} Hello *there*`))

    const caption = (tree as unknown as { children: Array<{ data?: { hName?: string }; children?: Array<{ type: string }> }> }).children[0]
    expect(caption.data?.hName).toBe(CAPTION_TAG)
    expect(caption.children?.some((child) => child.type === 'emphasis')).toBe(true)
  })
})
