'use client'

import React, { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from './Button'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  showLinkedInButton?: boolean
  linkedInUrl?: string
  contentPadding?: string
  maxWidth?: string
  children: React.ReactNode
}

const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  showLinkedInButton = false,
  linkedInUrl,
  contentPadding = "p-4",
  maxWidth = "max-w-2xl",
  children 
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Drawer */}
      <div 
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-background border border-blue-200/15 rounded-none transition-transform duration-300 ease-out w-full max-w-sm sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] ${
          isOpen ? 'translate-y-[-64px]' : 'translate-y-full'
        }`}
        style={{
          height: 'calc(100vh - 64px)', // Full height minus space for navigation to show above
          overflowY: 'auto',
          zIndex: 10,
          backgroundImage: `
            linear-gradient(rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 115, 115, 0.06) 1px, transparent 1px),
            repeating-linear-gradient(90deg, 
              rgba(0, 100, 255, 0.015) 0, 
              rgba(0, 100, 255, 0.015) calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6), 
              transparent calc((100% - 5 * var(--grid-major)) / 6 + var(--grid-major))
            )
          `,
          backgroundSize: 'var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 100% 100%',
          backgroundPosition: 'var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), var(--grid-major) var(--grid-major), 0 0'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between bg-background border-b border-blue-200/15 sticky top-0 z-30"
          style={{ 
            padding: 'var(--grid-major)',
            height: '64px'
          }}
        >
          <div className="flex items-center gap-3">
            {icon && <div className="flex items-center">{icon}</div>}
            <h2 className="text-xl font-semibold text-foreground font-[family-name:var(--font-geist-mono)]">{title}</h2>
            {showLinkedInButton && linkedInUrl && (
              <Button
                style="outline"
                color="primary"
                size="xsmall"
                onClick={() => window.open(linkedInUrl, '_blank')}
              >
                View on LinkedIn
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              style="ghost"
              color="primary"
              size="small"
              iconLeft={<XMarkIcon className="w-5 h-5" />}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={`${contentPadding} flex justify-center`}>
          <div className={`w-full ${maxWidth}`}>
            {children}
          </div>
        </div>
      </div>


    </>
  )
}

export default Drawer 