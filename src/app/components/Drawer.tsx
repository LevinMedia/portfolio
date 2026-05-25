'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { c64DrawerBtnClass } from '@/lib/c64-drawer-classes'

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
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  /** Pixels to scroll before header shadow (gap from header bottom to first content). */
  const scrollShadowThresholdRef = useRef(16)

  const measureScrollShadowThreshold = useCallback(() => {
    const scroller = scrollRef.current
    const page = contentRef.current
    if (!scroller || !page) return scrollShadowThresholdRef.current

    const header = scroller.querySelector<HTMLElement>('.c64-drawer-header')
    const contentTop =
      page.querySelector<HTMLElement>('.c64-grid-tile') ??
      page.querySelector<HTMLElement>('.c64-media-grid') ??
      page.firstElementChild

    if (!header || !contentTop) {
      const pt = parseFloat(getComputedStyle(page).paddingTop)
      scrollShadowThresholdRef.current =
        Number.isFinite(pt) && pt > 0 ? pt : 16
      return scrollShadowThresholdRef.current
    }

    const prevScroll = scroller.scrollTop
    scroller.scrollTop = 0

    const gap =
      contentTop.getBoundingClientRect().top -
      header.getBoundingClientRect().bottom

    scroller.scrollTop = prevScroll
    scrollShadowThresholdRef.current = Math.max(1, Math.round(gap))
    return scrollShadowThresholdRef.current
  }, [])

  const syncHeaderShadow = useCallback(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const threshold = scrollShadowThresholdRef.current
    setHeaderScrolled(scroller.scrollTop >= threshold)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setHeaderScrolled(false)
      return undefined
    }
    const scroller = scrollRef.current
    if (!scroller) return undefined

    const onScroll = () => syncHeaderShadow()
    const remeasure = () => {
      measureScrollShadowThreshold()
      syncHeaderShadow()
    }
    const ro = new ResizeObserver(remeasure)

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(remeasure)
    })

    scroller.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(scroller)
    if (contentRef.current) ro.observe(contentRef.current)

    return () => {
      cancelAnimationFrame(raf)

      scroller.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [isOpen, syncHeaderShadow, measureScrollShadowThreshold, children])

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
        ref={scrollRef}
        className={`drawer-container fixed inset-x-0 bottom-0 w-full max-w-none bg-[var(--c64-screen-bg)] border-t-4 border-x-4 border-[var(--c64-accent)] transform-gpu transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        {/* Header — inverse status bar */}
        <div
          className={`c64-drawer-header flex items-center justify-between sticky top-0 z-40 border-b-4 border-[var(--c64-accent)] bg-[var(--c64-border-bg)] ${
            headerScrolled ? 'c64-drawer-header--scrolled' : ''
          }`}
          style={{
            padding: 'var(--grid-major)',
            minHeight: '64px',
          }}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {icon && <div className="flex items-center flex-shrink-0 [&_svg]:text-current">{icon}</div>}
            <h2 className="text-xl font-normal whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-[0.08em]">
              {title}
            </h2>
            {showLinkedInButton && linkedInUrl && (
              <div className="hidden sm:block">
                <button
                  type="button"
                  className={c64DrawerBtnClass}
                  onClick={() => window.open(linkedInUrl, '_blank')}
                >
                  View on LinkedIn
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className={`${c64DrawerBtnClass} whitespace-nowrap`}
              onClick={onClose}
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={`c64-drawer-page ${contentPadding} flex justify-center`}
        >
          <div className={`w-full ${maxWidth} pb-24`}>{children}</div>
        </div>
      </div>


    </>
  )
}

export default Drawer 