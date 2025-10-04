'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
