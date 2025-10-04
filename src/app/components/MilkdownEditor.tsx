'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { nord } from '@milkdown/theme-nord'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { tooltip } from '@milkdown/plugin-tooltip'
import { slash } from '@milkdown/plugin-slash'
import { menu } from '@milkdown/plugin-menu'
import { emoji } from '@milkdown/plugin-emoji'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function MilkdownEditor({ value, onChange, placeholder, className }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<Editor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!editorRef.current) return

    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, editorRef.current!)
        ctx.set(defaultValueCtx, value)
        ctx.get(listenerCtx).markdownUpdated = (ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChange(markdown)
          }
        }
      })
      .use(nord)
      .use(commonmark)
      .use(listener)
      .use(history)
      .use(clipboard)
      .use(cursor)
      .use(tooltip)
      .use(slash)
      .use(menu)
      .use(emoji)
      .create()

    editorInstanceRef.current = editor
    setIsLoading(false)

    return () => {
      editor.destroy()
      editorInstanceRef.current = null
    }
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorInstanceRef.current && value !== editorInstanceRef.current.getMarkdown()) {
      editorInstanceRef.current.setMarkdown(value)
    }
  }, [value])

  if (isLoading) {
    return (
      <div className={`border border-border rounded-md p-3 bg-background ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-border rounded-md bg-background ${className}`}>
      <div ref={editorRef} className="min-h-[200px] p-3 prose prose-sm max-w-none" />
    </div>
  )
}
