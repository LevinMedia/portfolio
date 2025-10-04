'use client'

import { useEffect, useRef, useState } from 'react'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function MilkdownEditor({ value, onChange, placeholder, className }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    let isMounted = true
    let editorInstance: any = null

    // Set a timeout to show fallback if editor doesn't load
    const timeout = setTimeout(() => {
      console.log('Milkdown timeout - showing fallback')
      if (isMounted) {
        setIsLoading(false)
      }
    }, 2000)

    const initEditor = async () => {
      try {
        console.log('Starting Milkdown initialization...')
        
        // Dynamic import to avoid SSR issues
        const { Editor, rootCtx, defaultValueCtx } = await import('@milkdown/core')
        const { commonmark } = await import('@milkdown/preset-commonmark')
        const { gfm } = await import('@milkdown/preset-gfm')
        const { nord } = await import('@milkdown/theme-nord')
        const { listener, listenerCtx } = await import('@milkdown/plugin-listener')
        const { history } = await import('@milkdown/plugin-history')
        const { clipboard } = await import('@milkdown/plugin-clipboard')
        const { cursor } = await import('@milkdown/plugin-cursor')
        
        console.log('Milkdown modules loaded')

        if (!editorRef.current || !isMounted) {
          console.log('Editor ref not ready or unmounted')
          return
        }

        editorInstance = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, editorRef.current)
            ctx.set(defaultValueCtx, value || '')
            
            // Set up change listener
            ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
              if (isMounted) {
                console.log('Markdown updated:', markdown)
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
          .create()

        console.log('Milkdown editor created successfully!')
        
        if (isMounted) {
          clearTimeout(timeout)
          setEditor(editorInstance)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Milkdown initialization error:', err)
        if (isMounted) {
          clearTimeout(timeout)
          setIsLoading(false)
        }
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initEditor()
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timeout)
      if (editorInstance) {
        try {
          editorInstance.destroy()
        } catch (err) {
          console.error('Error destroying editor:', err)
        }
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className={`border border-border rounded-md p-3 bg-background ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Loading editor...</p>
      </div>
    )
  }

  // If editor failed to load, show a functional textarea fallback
  if (!editor) {
    console.log('Using textarea fallback')
    return (
      <div className={`border border-border rounded-md bg-background ${className}`}>
        <div className="p-2 text-center text-xs text-muted-foreground border-b border-border/20 bg-muted/20">
          Simple editor (Markdown supported)
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your message here... (Markdown supported)'}
          className="w-full p-3 border-0 bg-transparent resize-none focus:outline-none min-h-[200px] font-mono text-sm"
          rows={8}
        />
        <div className="p-2 text-xs text-muted-foreground border-t border-border/20">
          Tip: Use **bold**, *italic*, [links](url), images, etc.
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-border rounded-md bg-background overflow-hidden ${className}`}>
      <div 
        ref={editorRef} 
        className="milkdown-editor min-h-[200px]"
      />
    </div>
  )
}
