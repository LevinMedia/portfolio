import type { Ctx } from '@milkdown/ctx'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import type { NodeSchema } from '@milkdown/transformer'
import { $prose } from '@milkdown/utils'

export const IMAGE_BORDERLESS_CLASS = 'image-borderless'
const BORDERLESS_TOKEN = 'borderless'
const ALT_PATTERN = /^(\d+\.\d{2})(?:\s+borderless)?$/

export function parseImageBlockAlt(alt: string | null | undefined): {
  borderless: boolean
  ratio: number | null
  alt: string
} {
  const raw = (alt ?? '').trim()
  const match = raw.match(ALT_PATTERN)
  if (!match) return { borderless: false, ratio: null, alt: raw }

  const ratio = Number(match[1])
  return {
    borderless: raw.endsWith(BORDERLESS_TOKEN),
    ratio: !Number.isFinite(ratio) || ratio === 0 ? 1 : ratio,
    alt: '',
  }
}

export function formatImageBlockAlt(ratio: number, borderless: boolean): string {
  const safe = !Number.isFinite(ratio) || ratio === 0 ? 1 : ratio
  const ratioText = safe.toFixed(2)
  return borderless ? `${ratioText} ${BORDERLESS_TOKEN}` : ratioText
}

/** Image blocks store the ratio in alt text. Borderless rides along as `1.00 borderless`. */
export function withBorderlessImageBlock(schema: NodeSchema): NodeSchema {
  return {
    ...schema,
    attrs: {
      ...schema.attrs,
      borderless: { default: false },
    },
    parseDOM: [
      {
        tag: 'img[data-type="image-block"]',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) return false
          return {
            src: dom.getAttribute('src') || '',
            caption: dom.getAttribute('caption') || '',
            ratio: Number(dom.getAttribute('ratio') ?? 1) || 1,
            borderless: dom.getAttribute('borderless') === 'true',
          }
        },
      },
    ],
    toDOM: (node) => [
      'img',
      {
        'data-type': 'image-block',
        src: node.attrs.src,
        caption: node.attrs.caption,
        ratio: node.attrs.ratio,
        ...(node.attrs.borderless ? { borderless: 'true' } : {}),
      },
    ],
    parseMarkdown: {
      match: (node) => node.type === 'image-block',
      runner: (state, node, type) => {
        const parsed = parseImageBlockAlt(typeof node.alt === 'string' ? node.alt : '')
        state.addNode(type, {
          src: typeof node.url === 'string' ? node.url : '',
          caption: typeof node.title === 'string' ? node.title : '',
          ratio: parsed.ratio ?? 1,
          borderless: parsed.borderless,
        })
      },
    },
    toMarkdown: {
      match: (node) => node.type.name === 'image-block',
      runner: (state, node) => {
        state.openNode('paragraph')
        state.addNode('image', undefined, undefined, {
          title: node.attrs.caption,
          url: node.attrs.src,
          alt: formatImageBlockAlt(Number(node.attrs.ratio), Boolean(node.attrs.borderless)),
        })
        state.closeNode()
      },
    },
  }
}

const borderlessPluginKey = new PluginKey('image-borderless')

function imageBlockFromHost(view: EditorView, host: HTMLElement) {
  let pos: number
  try {
    pos = view.posAtDOM(host, 0)
  } catch {
    return null
  }
  const node = view.state.doc.nodeAt(pos)
  if (node?.type.name !== 'image-block') return null
  return { node, pos }
}

function fitCaptionField(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

/** The image caption is a single-line input, so long text clips. Mirror it with a wrapping field. */
function syncImageCaptions(root: HTMLElement) {
  root.querySelectorAll<HTMLInputElement>('.milkdown-image-block > input.caption-input').forEach((input) => {
    let field = input.nextElementSibling
    if (!(field instanceof HTMLTextAreaElement) || !field.classList.contains('caption-input')) {
      const textarea = document.createElement('textarea')
      textarea.className = 'caption-input'
      textarea.rows = 1
      textarea.setAttribute('aria-label', 'Image caption')
      const stop = (event: Event) => event.stopPropagation()
      textarea.addEventListener('pointerdown', stop)
      textarea.addEventListener('mousedown', stop)
      textarea.addEventListener('keydown', stop)
      textarea.addEventListener('keyup', stop)
      textarea.addEventListener('beforeinput', stop)
      textarea.addEventListener('paste', stop)
      textarea.addEventListener('input', () => {
        input.value = textarea.value
        input.dispatchEvent(new Event('input', { bubbles: true }))
        fitCaptionField(textarea)
      })
      textarea.addEventListener('blur', () => {
        input.value = textarea.value
        input.dispatchEvent(new Event('blur', { bubbles: true }))
      })
      textarea.addEventListener('dragstart', (event) => {
        event.preventDefault()
        event.stopPropagation()
      })
      input.insertAdjacentElement('afterend', textarea)
      field = textarea
    }

    field.placeholder = input.placeholder
    if (document.activeElement !== field && field.value !== input.value) {
      field.value = input.value
    }
    input.hidden = true
    fitCaptionField(field)
  })
}

function syncBorderlessControls(view: EditorView) {
  const hosts = view.dom.querySelectorAll<HTMLElement>('.milkdown-image-block')
  hosts.forEach((host) => {
    const found = imageBlockFromHost(view, host)
    const borderless = Boolean(found?.node.attrs.borderless)
    host.classList.toggle('is-borderless', borderless)

    const operation = host.querySelector('.operation')
    if (!operation) return

    let label = operation.querySelector<HTMLLabelElement>(':scope > .borderless-toggle')
    if (!label) {
      label = document.createElement('label')
      label.className = 'operation-item borderless-toggle'
      label.title = 'Borderless'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.tabIndex = -1
      input.setAttribute('aria-label', 'Borderless')
      const text = document.createElement('span')
      text.textContent = 'Borderless'
      label.append(input, text)
      const stop = (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
      }
      label.addEventListener('pointerdown', stop)
      label.addEventListener('dragstart', stop)
      label.addEventListener('pointerup', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!(event instanceof PointerEvent) || event.button !== 0) return
        const current = imageBlockFromHost(view, host)
        if (!current || !view.editable) return
        const next = !current.node.attrs.borderless
        input.checked = next
        host.classList.toggle('is-borderless', next)
        view.dispatch(view.state.tr.setNodeAttribute(current.pos, 'borderless', next))
      })
      operation.append(label)
    }

    const input = label.querySelector('input')
    if (input) input.checked = borderless
  })
}

export const imageBorderlessPlugin = $prose(
  (_ctx: Ctx) =>
    new Plugin({
      key: borderlessPluginKey,
      view(editorView) {
        let currentView = editorView
        const observer = new MutationObserver(() => {
          syncBorderlessControls(currentView)
          syncImageCaptions(currentView.dom)
        })
        observer.observe(editorView.dom, { childList: true, subtree: true })
        syncBorderlessControls(editorView)
        syncImageCaptions(editorView.dom)
        return {
          update(nextView) {
            currentView = nextView
            syncBorderlessControls(nextView)
            syncImageCaptions(nextView.dom)
          },
          destroy() {
            observer.disconnect()
          },
        }
      },
    })
)
