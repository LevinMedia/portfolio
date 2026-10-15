import type { NodeSchema } from '@milkdown/transformer'
import { describe, expect, it } from 'vitest'
import { formatImageBlockAlt, parseImageBlockAlt, withBorderlessImageBlock } from './image-borderless'

describe('image borderless alt', () => {
  it('leaves a plain ratio framed', () => {
    expect(parseImageBlockAlt('1.00')).toEqual({ borderless: false, ratio: 1, alt: '' })
    expect(formatImageBlockAlt(1, false)).toBe('1.00')
  })

  it('reads and writes the borderless flag next to the ratio', () => {
    expect(parseImageBlockAlt('1.00 borderless')).toEqual({ borderless: true, ratio: 1, alt: '' })
    expect(parseImageBlockAlt('0.50 borderless')).toEqual({ borderless: true, ratio: 0.5, alt: '' })
    expect(formatImageBlockAlt(0.5, true)).toBe('0.50 borderless')
  })

  it('does not treat the word borderless in a real alt as the flag', () => {
    expect(parseImageBlockAlt('a borderless photo')).toEqual({
      borderless: false,
      ratio: null,
      alt: 'a borderless photo',
    })
    expect(parseImageBlockAlt('100')).toEqual({ borderless: false, ratio: null, alt: '100' })
  })

  it('round-trips the flag through the image block schema', () => {
    const schema = withBorderlessImageBlock({
      attrs: {},
      parseMarkdown: { match: () => false, runner: () => undefined },
      toMarkdown: { match: () => false, runner: () => undefined },
    } as NodeSchema)

    const parsed: Record<string, unknown>[] = []
    schema.parseMarkdown.runner(
      { addNode: (_type: unknown, attrs: Record<string, unknown>) => parsed.push(attrs) } as never,
      { type: 'image-block', url: 'https://cdn.example/a.png', title: 'Desk', alt: '1.00 borderless' } as never,
      {} as never
    )
    expect(parsed[0]).toMatchObject({
      src: 'https://cdn.example/a.png',
      caption: 'Desk',
      ratio: 1,
      borderless: true,
    })

    const written: Record<string, unknown>[] = []
    schema.toMarkdown.runner(
      {
        openNode() {},
        closeNode() {},
        addNode(_type: string, _a: unknown, _b: unknown, attrs: Record<string, unknown>) {
          written.push(attrs)
        },
      } as never,
      { type: { name: 'image-block' }, attrs: parsed[0] } as never
    )
    expect(written[0]).toMatchObject({
      url: 'https://cdn.example/a.png',
      title: 'Desk',
      alt: '1.00 borderless',
    })
  })
})
