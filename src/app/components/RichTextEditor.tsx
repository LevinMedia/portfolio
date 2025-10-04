'use client'

import { useRef, useEffect, useState } from 'react'
import { 
  BoldIcon, 
  ItalicIcon, 
  ListBulletIcon, 
  LinkIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertEmoji = (emoji: string) => {
    execCommand('insertText', emoji)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const toolbarButtons = [
    {
      icon: BoldIcon,
      command: 'bold',
      title: 'Bold (Ctrl+B)'
    },
    {
      icon: ItalicIcon,
      command: 'italic',
      title: 'Italic (Ctrl+I)'
    },
    {
      icon: ListBulletIcon,
      command: 'insertUnorderedList',
      title: 'Bullet List'
    },
    {
      icon: LinkIcon,
      action: insertLink,
      title: 'Insert Link'
    }
  ]

  const emojis = ['😊', '😂', '❤️', '🎉', '🔥', '💯', '✨', '🌟', '🎨', '🚀']

  return (
    <div className={`border border-border rounded-md bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border/20 bg-muted/30">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button) => (
            <button
              key={button.command || 'link'}
              type="button"
              onClick={() => button.action ? button.action() : execCommand(button.command)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
              title={button.title}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        
        {/* Emoji Picker */}
        <div className="flex items-center space-x-1">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
              title={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[200px] p-3 focus:outline-none ${
          isFocused ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        style={{
          minHeight: '200px',
          outline: 'none'
        }}
        data-placeholder={placeholder || 'Write your message here...'}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
