'use client'

import { useEffect, useRef, useState } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

interface CrepeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function CrepeEditor({ value, onChange, placeholder, className }: CrepeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Clear any existing content
    editorRef.current.innerHTML = ''

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: value || '',
      placeholder: placeholder || 'Write your message here... Use / for commands!',
    })

    crepeRef.current = crepe

    crepe.create().then(() => {
      setIsLoading(false)
      setError(null)
      console.log('Crepe editor created successfully')
      
      // Set up change listener
      crepe.editor?.action((ctx) => {
        const listener = ctx.get('listenerCtx')
        if (listener) {
          listener.markdownUpdated = (ctx, markdown) => {
            onChange(markdown)
          }
        }
      })
    }).catch((error) => {
      console.error('Failed to create Crepe editor:', error)
      setError('Failed to load editor')
      setIsLoading(false)
    })

    return () => {
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy()
        } catch (e) {
          console.error('Error destroying Crepe editor:', e)
        }
        crepeRef.current = null
      }
    }
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (crepeRef.current && value !== crepeRef.current.getMarkdown()) {
      try {
        crepeRef.current.setMarkdown(value)
      } catch (e) {
        console.error('Error setting markdown:', e)
      }
    }
  }, [value])

  if (error) {
    return (
      <div className={`border border-border rounded-md p-3 bg-background ${className}`}>
        <div className="text-center text-muted-foreground">
          <p>Failed to load editor. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
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
    <div className={`border border-border rounded-md bg-background ${className}`}>
      <div ref={editorRef} className="min-h-[200px]" />
    </div>
  )
}
