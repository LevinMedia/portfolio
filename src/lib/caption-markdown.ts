/** Stored at the start of a caption paragraph so italic and other marks still round-trip. */
export const CAPTION_MARKER = '{.caption}'

export const CAPTION_CLASS = 'md-caption'

/** Hast tag react-markdown maps to a caption paragraph. */
export const CAPTION_TAG = 'mdcaption'

type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  data?: {
    hName?: string
    hProperties?: { className?: string[] }
  }
}

function stripCaptionParagraph(paragraph: MdNode): MdNode | null {
  const children = paragraph.children
  if (!children?.length) return null
  const first = children[0]
  if (first.type !== 'text' || typeof first.value !== 'string') return null
  if (!first.value.startsWith(CAPTION_MARKER)) return null

  let rest = first.value.slice(CAPTION_MARKER.length)
  if (rest.startsWith(' ')) rest = rest.slice(1)

  const nextChildren = rest.length
    ? [{ ...first, value: rest }, ...children.slice(1)]
    : children.slice(1)

  return { ...paragraph, children: nextChildren }
}

function mapParagraphs(node: MdNode, mapParagraph: (paragraph: MdNode) => MdNode) {
  if (!node.children) return
  node.children = node.children.map((child) => {
    if (child.type === 'paragraph') return mapParagraph(child)
    mapParagraphs(child, mapParagraph)
    return child
  })
}

/** Public renderer: turn the marker into a caption element and leave emphasis intact. */
export function remarkCaption() {
  return (tree: MdNode) => {
    mapParagraphs(tree, (paragraph) => {
      const stripped = stripCaptionParagraph(paragraph)
      if (!stripped) return paragraph
      return {
        ...stripped,
        data: {
          hName: CAPTION_TAG,
          hProperties: { className: [CAPTION_CLASS] },
        },
      }
    })
  }
}

/** Editor parser: turn the marker into a caption mdast node. */
export function remarkCaptionNode() {
  return (tree: MdNode) => {
    mapParagraphs(tree, (paragraph) => {
      const stripped = stripCaptionParagraph(paragraph)
      if (!stripped) return paragraph
      return { type: 'caption', children: stripped.children }
    })
  }
}

type CaptionStringifyState = {
  enter: (name: string) => () => void
  containerPhrasing: (node: unknown, info: Record<string, unknown>) => string
}

/** remark-stringify handler so the editor writes the marker back out. */
export function stringifyCaption(
  node: unknown,
  _parent: unknown,
  state: CaptionStringifyState,
  info: Record<string, unknown>,
) {
  const exit = state.enter('caption')
  const value = state.containerPhrasing(node, info)
  exit()
  return value ? `${CAPTION_MARKER} ${value}` : CAPTION_MARKER
}
