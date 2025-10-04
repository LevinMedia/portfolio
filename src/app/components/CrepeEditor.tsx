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

  useEffect(() => {
    if (!editorRef.current) return

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: value,
      placeholder: placeholder || 'Write your message here... Use / for commands!',
    })

    crepeRef.current = crepe

    crepe.create().then(() => {
      setIsLoading(false)
      
      // Listen for changes
      crepe.editor?.action((ctx) => {
        const listener = ctx.get('listenerCtx')
        listener.markdownUpdated = (ctx, markdown) => {
          onChange(markdown)
        }
      })
    }).catch((error) => {
      console.error('Failed to create Crepe editor:', error)
      setIsLoading(false)
    })

    return () => {
      crepe.destroy()
      crepeRef.current = null
    }
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (crepeRef.current && value !== crepeRef.current.getMarkdown()) {
      crepeRef.current.setMarkdown(value)
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
      <div ref={editorRef} className="min-h-[200px]" />
    </div>
  )
}
