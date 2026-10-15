import type { MilkdownPlugin } from '@milkdown/ctx'
import { remarkPluginsCtx } from '@milkdown/core'
import { $nodeSchema } from '@milkdown/utils'
import { remarkCaptionNode } from './caption-markdown'

export const captionSchema = $nodeSchema('caption', () => ({
  content: 'inline*',
  group: 'block',
  parseDOM: [{ tag: 'p.md-caption', priority: 70 }],
  toDOM: () => ['p', { class: 'md-caption' }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'caption',
    runner: (state, node, type) => {
      state.openNode(type)
      if (node.children) state.next(node.children)
      state.closeNode()
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'caption',
    runner: (state, node) => {
      state.openNode('caption')
      state.next(node.content)
      state.closeNode()
    },
  },
}))

/** Registers the caption remark transform before the schema reads remark plugins. */
export const remarkCaptionPlugin: MilkdownPlugin = (ctx) => {
  ctx.update(remarkPluginsCtx, (plugins) => [
    ...plugins,
    { plugin: remarkCaptionNode, options: {} },
  ])

  return async () => {}
}
