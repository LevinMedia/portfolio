'use client'

import Button from './Button'
import { ReactNode, useState, cloneElement, isValidElement } from 'react'
import { Bars3Icon } from "@heroicons/react/24/outline"
import Drawer from './Drawer'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const childrenArray = Array.isArray(children) ? children : [children]
  const logoElement = childrenArray[0] // First child is the logo/CircleInSquare
  const navigationItems = childrenArray.slice(1) // Rest are navigation items

  const handleMobileMenuOpen = () => {
    setIsMobileMenuOpen(true)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Clone navigation items with modified onClick handlers for mobile menu
  const mobileNavigationItems = navigationItems.map((item, index) => {
    if (isValidElement(item)) {
      const typedItem = item as React.ReactElement<{ onClick?: () => void }>
      return cloneElement(typedItem, {
        key: index,
        onClick: () => {
          // Close mobile menu first
          setIsMobileMenuOpen(false)
          // Then execute original onClick if it exists
          if (typedItem.props.onClick) {
            typedItem.props.onClick()
          }
        }
      })
    }
    return item
  })

  return (
    <>
      <nav className="flex items-center justify-between bg-background border border-blue-200/15 rounded-none w-full" style={{ 
        gap: 'var(--grid-major)', 
        padding: 'var(--grid-major)', 
        height: '64px'
      }}>
        {/* Logo - always visible */}
        {logoElement}
        
        {/* Navigation items - hidden on md and below */}
        <div className="hidden lg:flex items-center" style={{ gap: 'var(--grid-major)' }}>
          {navigationItems}
        </div>
        
        {/* Hamburger menu - visible on md and below */}
        <div className="lg:hidden">
          <Button
            style="ghost"
            color="primary"
            size="small"
            iconLeft={<Bars3Icon className="w-5 h-5" />}
            className="flex-shrink-0"
            onClick={handleMobileMenuOpen}
          >
            Menu
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        title="Menu"
        icon={<Bars3Icon className="w-6 h-6" />}
        contentPadding="p-4"
      >
        <div className="space-y-4">
          {mobileNavigationItems.map((item, index) => (
            <div key={index} className="w-full">
              {item}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
} 