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

    console.log('Initializing Crepe editor...')

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: value || '',
      placeholder: placeholder || 'Write your message here... Use / for commands!',
    })

    crepeRef.current = crepe

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Crepe editor timeout - falling back to textarea')
      setIsLoading(false)
      setError('Editor failed to load - using fallback')
    }, 5000)

    crepe.create().then(() => {
      clearTimeout(timeout)
      setIsLoading(false)
      setError(null)
      console.log('Crepe editor created successfully')
      
      // Set up change listener
      try {
        crepe.editor?.action((ctx) => {
          const listener = ctx.get('listenerCtx')
          if (listener) {
            listener.markdownUpdated = (ctx, markdown) => {
              onChange(markdown)
            }
          }
        })
      } catch (e) {
        console.error('Error setting up change listener:', e)
      }
    }).catch((error) => {
      clearTimeout(timeout)
      console.error('Failed to create Crepe editor:', error)
      setError('Failed to load editor')
      setIsLoading(false)
    })

    return () => {
      clearTimeout(timeout)
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
      <div className={`border border-border rounded-md bg-background ${className}`}>
        <div className="p-3 text-center text-muted-foreground border-b border-border/20">
          <p className="text-sm">Using fallback editor</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your message here... (Markdown supported!)'}
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
    <div className={`border border-border rounded-md bg-background ${className}`}>
      <div ref={editorRef} className="min-h-[200px]" />
    </div>
  )
}
