'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  focusFirstWhenReady,
  getFocusableElements,
} from '@/lib/focus'
import ChromeDrawerBreadcrumbs, {
  type ChromeDrawerBreadcrumb,
} from './ChromeDrawerBreadcrumbs'
import ChromeDrawerLogo from './ChromeDrawerLogo'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string | React.ReactNode
  breadcrumbs?: ChromeDrawerBreadcrumb[]
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
  breadcrumbs,
  icon,
  showLinkedInButton = false,
  linkedInUrl,
  contentPadding = 'p-4',
  maxWidth = 'max-w-2xl',
  children,
}) => {
  const isFlushPage = contentPadding === 'p-0'
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollShadowThresholdRef = useRef(16)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const body = contentRef.current
      const drawer = scrollRef.current
      if (!body || !drawer) return

      const focusables = getFocusableElements(body)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || (active instanceof Node && !body.contains(active))) {
          e.preventDefault()
          last.focus({ preventScroll: true })
        }
        return
      }

      if (active === last || (active instanceof Node && !drawer.contains(active))) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      const restore = previousFocusRef.current
      previousFocusRef.current = null
      if (restore?.isConnected) {
        requestAnimationFrame(() => restore.focus({ preventScroll: true }))
      }
      return undefined
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    let cancelFocusReady = () => {}
    const timer = window.setTimeout(() => {
      cancelFocusReady = focusFirstWhenReady(contentRef.current)
    }, 50)

    return () => {
      window.clearTimeout(timer)
      cancelFocusReady()
    }
  }, [isOpen, children])

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
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, onClose])

  return (
    <>
      <div
        className={`drawer-chrome-backdrop fixed inset-0 z-[9] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <div
        ref={scrollRef}
        className={`drawer-container drawer-chrome fixed inset-x-0 bottom-0 w-full max-w-none transform-gpu transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-y-0 drawer-chrome--open' : 'translate-y-full'
        }`}
        style={{
          overflowY: 'auto',
          zIndex: 10,
        }}
        inert={!isOpen ? true : undefined}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal={isOpen ? true : undefined}
      >
        <div
          className={`c64-drawer-header flex items-center justify-between sticky top-0 z-40 ${
            headerScrolled ? 'c64-drawer-header--scrolled' : ''
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {icon ? (
              <div className="flex items-center flex-shrink-0 [&_svg]:text-current [&_svg]:h-5 [&_svg]:w-5">
                {icon}
              </div>
            ) : (
              <ChromeDrawerLogo />
            )}
            {breadcrumbs ? (
              <ChromeDrawerBreadcrumbs items={breadcrumbs} />
            ) : title ? (
              <h2 className="chrome-drawer-title whitespace-nowrap overflow-hidden text-ellipsis">
                {title}
              </h2>
            ) : null}
            {showLinkedInButton && linkedInUrl && (
              <div className="hidden sm:block">
                <button
                  type="button"
                  className="c64-drawer-btn"
                  tabIndex={-1}
                  onClick={() => window.open(linkedInUrl, '_blank')}
                >
                  View on LinkedIn
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="chrome-drawer-close"
              tabIndex={-1}
              onClick={onClose}
              aria-label="Close"
            >
              <span className="hidden sm:inline">Close</span>
              <XMarkIcon className="size-6 shrink-0 sm:size-5 sm:ml-1" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          className={`c64-drawer-page ${contentPadding}${isFlushPage ? ' c64-drawer-page--flush' : ' c64-drawer-page--stacked'} flex justify-center`}
        >
          <div className={`w-full ${maxWidth} pb-24`}>{children}</div>
        </div>
      </div>
    </>
  )
}

export default Drawer
