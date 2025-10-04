'use client'

import { forwardRef } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors appearance-none pr-10 ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
