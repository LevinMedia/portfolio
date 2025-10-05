'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CrepeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function CrepeEditor({ value, onChange, placeholder, className }: CrepeEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  return (
    <div className={`border border-border rounded-md bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border/20 bg-muted/20">
        <button
          type="button"
          onClick={() => insertMarkdown('**', '**')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50 font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('*', '*')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50 italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('[', '](url)')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50"
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('![alt](', ')')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50"
          title="Image"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('\n- ', '')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50"
          title="List"
        >
          📝
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('\n> ', '')}
          className="px-2 py-1 text-sm rounded hover:bg-muted/50"
          title="Quote"
        >
          💬
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1 text-sm rounded ${showPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
        >
          {showPreview ? '✏️ Edit' : '👁️ Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="p-3 min-h-[200px] prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*Nothing to preview yet...*'}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your message here... (Markdown supported! Use the toolbar above for formatting)'}
          className="w-full p-3 border-0 bg-transparent resize-none focus:outline-none min-h-[200px] font-mono text-sm"
          rows={8}
        />
      )}

      {/* Help text */}
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/20">
        Markdown supported: **bold**, *italic*, [links](url), images, lists, and more!
      </div>
    </div>
  )
}
