'use client'

import { Button as HeadlessButton } from '@headlessui/react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'

export interface ButtonProps {
  children: React.ReactNode
  style?: 'solid' | 'outline' | 'ghost'
  color?: 'primary' | 'secondary' | 'accent' | 'destructive'
  size?: 'xsmall' | 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    style = 'solid', 
    color = 'primary',
    size = 'medium', 
    disabled = false, 
    className = '',
    onClick,
    type = 'button',
    iconLeft,
    iconRight,
    fullWidth = false,
    ...props 
  }, ref) => {
    const baseStyles = fullWidth 
      ? 'flex w-full items-center justify-center font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center justify-center font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
    
    // Style variants (visual treatment). Solid text uses theme foreground tokens (SSR-safe).
    const styleVariants = {
      solid: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:outline-secondary',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:outline-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-destructive',
      },
      outline: {
        primary: 'border !border-primary text-primary hover:bg-primary/10 focus-visible:outline-primary dark:brightness-125',
        secondary: 'border !border-secondary text-secondary hover:bg-secondary/10 focus-visible:outline-secondary dark:brightness-125',
        accent: 'border !border-accent text-accent hover:bg-accent/10 focus-visible:outline-accent dark:brightness-125',
        destructive: 'border !border-destructive text-destructive hover:bg-destructive/10 focus-visible:outline-destructive dark:brightness-125'
      },
      ghost: {
        primary: 'hover:bg-primary/10 text-primary hover:text-primary focus-visible:outline-primary dark:brightness-125',
        secondary: 'hover:bg-secondary/10 text-secondary hover:text-secondary focus-visible:outline-secondary dark:brightness-125',
        accent: 'hover:bg-accent/10 text-accent hover:text-accent focus-visible:outline-accent dark:brightness-125',
        destructive: 'hover:bg-destructive/10 text-destructive hover:text-destructive focus-visible:outline-destructive dark:brightness-125'
      }
    }
    
    const sizeStyles = {
      xsmall: 'h-6 px-2 text-xs font-semibold tracking-normal',
      small: 'h-8 px-3 text-sm font-semibold tracking-normal',
      /** Match C64 form label scale (`text-base` / `sm:text-lg` in guestbook / sign-in). */
      medium: 'min-h-11 px-4 py-2.5 text-base',
      large: 'min-h-14 px-6 py-3 text-base sm:text-lg',
    }
    
    return (
      <HeadlessButton
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={clsx(
          baseStyles,
          styleVariants[style][color],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {iconLeft && <span className="mr-2 flex items-center">{iconLeft}</span>}
        {children}
        {iconRight && <span className="ml-2 flex items-center">{iconRight}</span>}
      </HeadlessButton>
    )
  }
)

Button.displayName = 'Button'

export default Button 