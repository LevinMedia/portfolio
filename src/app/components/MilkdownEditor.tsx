'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { nord } from '@milkdown/theme-nord'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { slash } from '@milkdown/plugin-slash'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function MilkdownEditor({ value, onChange, placeholder, className }: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Callback ref to ensure we know when the DOM element is actually ready
  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('✅ DOM node is ready!', node)
      containerRef.current = node
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    if (!isMounted || !containerRef.current) {
      console.log('⏳ Waiting for mount...', { isMounted, hasRef: !!containerRef.current })
      return
    }

    let isActive = true
    let timeoutId: NodeJS.Timeout

    const initEditor = async () => {
      try {
        console.log('🚀 Starting Milkdown initialization...')
        console.log('📦 Container ref:', containerRef.current)

        const editor = await Editor.make()
          .config(nord)
          .config((ctx) => {
            console.log('⚙️ Configuring editor context...')
            ctx.set(rootCtx, containerRef.current!)
            ctx.set(defaultValueCtx, value || '')
            
            // Set up change listener IMMEDIATELY in config
            ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
              if (isActive) {
                console.log('📝 Markdown updated')
                onChange(markdown)
              }
            })
          })
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .use(history)
          .use(clipboard)
          .use(cursor)
          .use(slash)
          .create()

        console.log('✅ Editor created successfully!')

        if (!isActive) {
          console.log('⚠️ Component unmounted, destroying editor')
          editor.destroy()
          return
        }

        editorRef.current = editor
        setIsReady(true)
        clearTimeout(timeoutId)
        console.log('🎉 Milkdown is ready!')

      } catch (err) {
        console.error('❌ Milkdown initialization failed:', err)
        if (isActive) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    // Set a timeout to show error after 5 seconds
    timeoutId = setTimeout(() => {
      if (!isReady && isActive) {
        console.error('⏱️ Milkdown initialization timeout')
        setError('Editor initialization timeout')
      }
    }, 5000)

    // Start initialization with a small delay
    setTimeout(initEditor, 100)

    return () => {
      console.log('🧹 Cleaning up editor...')
      isActive = false
      clearTimeout(timeoutId)
      if (editorRef.current) {
        try {
          editorRef.current.destroy()
          console.log('✅ Editor destroyed')
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
        editorRef.current = null
      }
    }
  }, [isMounted, onChange, value])

  if (error) {
    return (
      <div className={`border border-destructive/50 rounded-md bg-background ${className}`}>
        <div className="p-3 text-center text-destructive border-b border-destructive/20 bg-destructive/5">
          <p className="text-sm font-medium">Editor failed to load</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your message here... (Markdown supported)'}
          className="w-full p-3 border-0 bg-transparent resize-none focus:outline-none min-h-[200px] font-mono text-sm"
          rows={8}
        />
        <div className="p-2 text-xs text-muted-foreground border-t border-border/20">
          Fallback mode: Markdown supported
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className={`border border-border rounded-md bg-background overflow-hidden ${className}`}>
        <div 
          ref={refCallback}
          className="milkdown-editor prose prose-sm max-w-none dark:prose-invert p-3"
          style={{ minHeight: '200px' }}
        >
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center animate-pulse">
            Loading Milkdown editor...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-border rounded-md bg-background overflow-hidden ${className}`}>
      <div 
        ref={refCallback}
        className="milkdown-editor prose prose-sm max-w-none dark:prose-invert"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
