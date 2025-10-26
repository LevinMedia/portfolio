'use client'

import { Button as HeadlessButton } from '@headlessui/react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import chroma from 'chroma-js'

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
    // Determine text color for solid buttons based on background contrast
    // Calculate on each render to react to color changes
    const getTextColorForSolid = (colorName: string): string => {
      if (typeof window === 'undefined') return 'text-white'
      
      try {
        // Get the computed CSS variable value
        const bgColor = getComputedStyle(document.documentElement)
          .getPropertyValue(`--${colorName}`)
          .trim()
        
        if (!bgColor) return 'text-white'
        
        const whiteContrast = chroma.contrast(bgColor, '#ffffff')
        const darkContrast = chroma.contrast(bgColor, '#09090b')
        
        // Use dark text if it has better contrast than white
        return darkContrast > whiteContrast ? 'text-[#09090b]' : 'text-white'
      } catch {
        return 'text-white'
      }
    }
    
    const baseStyles = fullWidth 
      ? 'flex w-full items-center justify-center font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
    
    // Calculate text color for solid buttons only when needed
    const getTextColorClass = (): string => {
      if (style !== 'solid') return ''
      return getTextColorForSolid(color)
    }
    
    // Style variants (visual treatment)
    const styleVariants = {
      solid: {
        primary: `bg-primary ${getTextColorClass()} hover:bg-primary/90 focus-visible:outline-primary`,
        secondary: `bg-secondary ${getTextColorClass()} hover:bg-secondary/90 focus-visible:outline-secondary`,
        accent: `bg-accent ${getTextColorClass()} hover:bg-accent/90 focus-visible:outline-accent`,
        destructive: `bg-destructive ${getTextColorClass()} hover:bg-destructive/90 focus-visible:outline-destructive`
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
      xsmall: 'h-6 px-2 text-xs rounded-sm',
      small: 'h-8 px-3 text-sm rounded-md',
      medium: 'h-10 px-4 text-sm rounded-md',
      large: 'h-12 px-6 text-base rounded-lg'
    }
    
    // Get CSS variable values for inline styles as fallback
    const getCSSVarValue = (varName: string): string => {
      if (typeof window === 'undefined') return ''
      return getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`).trim()
    }

    // Create inline styles for solid buttons to ensure colors work
    const getInlineStyles = (): React.CSSProperties => {
      if (style !== 'solid') return {}
      
      const colorVar = getCSSVarValue(color)
      if (!colorVar) return {}
      
      return {
        backgroundColor: colorVar,
        borderColor: colorVar
      }
    }

    return (
      <HeadlessButton
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        style={getInlineStyles()}
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