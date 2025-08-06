'use client'

import Button from './Button'
import { ReactNode } from 'react'

interface NavigationItemProps {
  icon: ReactNode
  label: string
  href?: string
  onClick?: () => void
}

export function NavigationItem({ icon, label, href, onClick }: NavigationItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      window.location.href = href
    }
  }

  return (
    <Button
      style="ghost"
      color="primary"
      size="small"
      iconLeft={icon}
      onClick={handleClick}
      className="flex-shrink-0"
    >
      {label}
    </Button>
  )
}

interface NavigationProps {
  children: ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  return (
    <nav className="flex items-center justify-start bg-background border border-blue-200/15 rounded-none w-full" style={{ 
      gap: 'var(--grid-major)', 
      padding: 'var(--grid-major)', 
      height: '64px'
    }}>
      {children}
    </nav>
  )
} 