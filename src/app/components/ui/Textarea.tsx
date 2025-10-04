'use client'

import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors resize-vertical ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
