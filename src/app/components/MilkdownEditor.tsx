'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { nord } from '@milkdown/theme-nord'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { emoji } from '@milkdown/plugin-emoji'

import '@milkdown/theme-nord/style.css'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    let isMounted = true

    const initEditor = async () => {
      try {
        console.log('Initializing Milkdown editor...')

        const editor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, editorRef.current)
            ctx.set(defaultValueCtx, value || '')
            
            // Set up change listener
            ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
              if (isMounted) {
                onChange(markdown)
              }
            })
          })
          .config(nord)
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .use(history)
          .use(clipboard)
          .use(cursor)
          .use(emoji)
          .create()

        if (isMounted) {
          editorInstanceRef.current = editor
          setIsLoading(false)
          console.log('Milkdown editor initialized successfully')
        }
      } catch (err) {
        console.error('Failed to initialize Milkdown:', err)
        if (isMounted) {
          setError('Failed to load editor')
          setIsLoading(false)
        }
      }
    }

    initEditor()

    return () => {
      isMounted = false
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy()
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
        editorInstanceRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className={`border border-border rounded-md bg-background ${className}`}>
        <div className="p-3 text-center text-muted-foreground border-b border-border/20">
          <p className="text-sm">Editor failed to load</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your message here...'}
          className="w-full p-3 border-0 bg-transparent resize-none focus:outline-none min-h-[200px]"
          rows={8}
        />
      </div>
    )
  }

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
    <div className={`border border-border rounded-md bg-background overflow-hidden ${className}`}>
      <div 
        ref={editorRef} 
        className="milkdown-editor p-3 min-h-[200px] prose prose-sm max-w-none dark:prose-invert"
      />
    </div>
  )
}
