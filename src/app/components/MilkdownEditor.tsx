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

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function MilkdownEditor({ value, onChange, placeholder, className }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<Editor | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const initEditor = async () => {
      // Wait for next tick to ensure ref is attached
      await new Promise(resolve => setTimeout(resolve, 0))

      if (!editorRef.current) {
        console.error('❌ Editor ref is still null after waiting')
        if (isMounted) {
          setError('Editor container not ready')
        }
        return
      }

      try {
        console.log('🚀 Starting Milkdown initialization...')
        console.log('📦 Editor ref exists:', !!editorRef.current)
        console.log('📦 Editor ref element:', editorRef.current.tagName)

        const editor = Editor.make()
          .config(nord)
          .config((ctx) => {
            console.log('⚙️ Configuring editor context...')
            ctx.set(rootCtx, editorRef.current!)
            ctx.set(defaultValueCtx, value || '')
          })
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .use(history)
          .use(clipboard)
          .use(cursor)

        console.log('🔧 Plugins configured, creating editor...')
        
        const createdEditor = await editor.create()
        
        console.log('✅ Editor created successfully!')

        if (!isMounted) {
          console.log('⚠️ Component unmounted, destroying editor')
          createdEditor.destroy()
          return
        }

        // Set up the change listener
        createdEditor.action((ctx) => {
          const listener = ctx.get(listenerCtx)
          listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
              console.log('📝 Markdown updated')
              onChange(markdown)
            }
          })
        })

        editorInstanceRef.current = createdEditor
        setIsReady(true)
        clearTimeout(timeoutId)
        console.log('🎉 Milkdown is ready!')

      } catch (err) {
        console.error('❌ Milkdown initialization failed:', err)
        console.error('Error details:', err)
        if (isMounted) {
          setError(String(err))
        }
      }
    }

    // Set a timeout to show error after 5 seconds
    timeoutId = setTimeout(() => {
      if (!isReady && isMounted) {
        console.error('⏱️ Milkdown initialization timeout')
        setError('Editor initialization timeout')
      }
    }, 5000)

    // Start initialization
    initEditor()

    return () => {
      console.log('🧹 Cleaning up editor...')
      isMounted = false
      clearTimeout(timeoutId)
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy()
          console.log('✅ Editor destroyed')
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
        editorInstanceRef.current = null
      }
    }
  }, []) // Only run once on mount

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
      <div className={`border border-border rounded-md p-3 bg-background ${className}`}>
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
    )
  }

  return (
    <div className={`border border-border rounded-md bg-background overflow-hidden ${className}`}>
      <div 
        ref={editorRef}
        className="milkdown-editor prose prose-sm max-w-none dark:prose-invert"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
