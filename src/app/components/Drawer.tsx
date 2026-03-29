'use client'

import React, { useEffect, useState } from 'react'
import Button from './Button'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
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
  children,
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

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Esc') return
      const el = e.target
      if (el instanceof HTMLElement) {
        const tag = el.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (el.isContentEditable) return
      }
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
    // Capture phase so nested components / libraries that stopPropagation on bubble still close.
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 w-full max-w-none bg-[var(--c64-screen-bg)] border-t-4 border-x-4 border-[var(--c64-accent)] transition-transform duration-300 ease-out drawer-container motion-reduce:transition-none ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        {/* Header — inverse status bar */}
        <div
          className="c64-drawer-header flex items-center justify-between sticky top-0 z-30 border-b-4 border-[var(--c64-accent)] bg-[var(--c64-border-bg)] text-[var(--c64-accent)]"
          style={{
            padding: 'var(--grid-major)',
            minHeight: '64px',
          }}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {icon && <div className="flex items-center flex-shrink-0 [&_svg]:text-[var(--c64-accent)]">{icon}</div>}
            <h2 className="text-xl font-normal whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-[0.08em]">
              {title}
            </h2>
            {showLinkedInButton && linkedInUrl && (
              <div className="hidden sm:block">
                <Button
                  style="outline"
                  color="primary"
                  size="xsmall"
                  onClick={() => window.open(linkedInUrl, '_blank')}
                >
                  View on LinkedIn
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              style="outline"
              color="primary"
              size="large"
              className="c64-drawer-close min-h-12 min-w-0 shrink-0 whitespace-nowrap border-2 !border-[var(--c64-accent)] px-3 text-base !font-normal uppercase tracking-[0.06em] text-[var(--c64-accent)] bg-transparent hover:!bg-[var(--c64-accent)] hover:!text-[var(--c64-border-bg)] focus-visible:!bg-[var(--c64-accent)] focus-visible:!text-[var(--c64-border-bg)]"
              onClick={onClose}
            >
              CLOSE[ESC]
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={`c64-drawer-page ${contentPadding} flex justify-center`}>
          <div className={`w-full ${maxWidth} pb-24`}>{children}</div>
        </div>
      </div>


    </>
  )
}

export default Drawer 