'use client'

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Drawer from './Drawer'
import PrivateIndexContent from './PrivateIndexContent'
import { hasOpenHomeDrawer } from '@/lib/drawer-url'
import type { PrivateIndexData } from '@/lib/private-index'

/** sessionStorage: '0' once the viewer closes their Index, so reloads keep it closed. */
const OPEN_STORAGE_KEY = 'private-index-open'
/** Drawer slide transition (duration-300) plus a beat for the transition to start. */
const DRAWER_SLIDE_MS = 350

interface PrivateIndexContextValue {
  /** The signed-in password-access viewer's Index; null when they have none. */
  index: PrivateIndexData | null
  /** Index overlay is open (possibly underneath another page). */
  isOpen: boolean
  /** Index overlay is open and nothing is stacked over it. */
  isOnTop: boolean
  /** A standalone page is sliding away to reveal the Index. */
  isLeaving: boolean
  /** Whether the Index was the visible page just before the current navigation. */
  wasOnTop: () => boolean
  /** Last home URL (`/` or `/?drawer=true`) — where a page stacked over the Index closes back to. */
  getReturnHref: () => string
  /** Re-read the viewer's Index (after sign-in). `open` also brings it up. */
  refresh: (options?: { open?: boolean }) => Promise<PrivateIndexData | null>
  /** Forget the Index (sign-out). */
  clear: () => void
  /** Navigate away from a standalone page; slides it down first when that reveals the Index. */
  leaveTo: (url: string) => void
}

const PrivateIndexContext = createContext<PrivateIndexContextValue>({
  index: null,
  isOpen: false,
  isOnTop: false,
  isLeaving: false,
  wasOnTop: () => false,
  getReturnHref: () => '/',
  refresh: async () => null,
  clear: () => {},
  leaveTo: () => {},
})

export function usePrivateIndex(): PrivateIndexContextValue {
  return useContext(PrivateIndexContext)
}

/**
 * Open state for a standalone route's drawer (featured work / field note detail).
 * With no Index underneath it is simply open, as before. When the viewer came straight
 * from their Index, the drawer slides up over it and slides back down on the way out.
 */
export function useStandaloneDrawer() {
  const { isOpen: indexOpen, isLeaving, wasOnTop, getReturnHref, leaveTo } = usePrivateIndex()
  const [entered, setEntered] = useState(() => !wasOnTop())

  useEffect(() => {
    if (entered) return undefined
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [entered])

  return {
    isOpen: entered && !isLeaving,
    /** Index is open underneath this page. */
    indexOpen,
    getReturnHref,
    leaveTo,
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function readStoredOpen(): boolean {
  try {
    return sessionStorage.getItem(OPEN_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

function storeOpen(open: boolean | null) {
  try {
    if (open === null) sessionStorage.removeItem(OPEN_STORAGE_KEY)
    else sessionStorage.setItem(OPEN_STORAGE_KEY, open ? '1' : '0')
  } catch {
    // ignore
  }
}

/** Reports home drawer query state upward (kept in its own Suspense boundary). */
function HomeSearchWatcher({ onChange }: { onChange: (search: string, drawerOpen: boolean) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    onChange(searchParams.toString(), hasOpenHomeDrawer(searchParams))
  }, [searchParams, onChange])
  return null
}

/**
 * Password-access "Index": an optional per-password landing page. It sits over the home
 * screen and under every other drawer, so pages opened from it slide up over it and
 * closing them reveals it again. A floating button returns to it from anywhere.
 */
export default function PrivateIndexProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [index, setIndex] = useState<PrivateIndexData | null>(null)
  const [wantOpen, setWantOpen] = useState(true)
  const [location, setLocation] = useState({ search: '', drawerOpen: false })
  const [isLeaving, setIsLeaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const leaveTimerRef = useRef<number | null>(null)

  const isOpen = !!index && wantOpen
  const covered = pathname !== '/' || location.drawerOpen
  const isOnTop = isOpen && !covered

  /** Read during a destination page's first render, i.e. before these effects catch up. */
  const isOpenRef = useRef(false)
  const wasOnTopRef = useRef(false)
  const returnHrefRef = useRef('/')

  useEffect(() => {
    isOpenRef.current = isOpen
    wasOnTopRef.current = isOnTop
  }, [isOpen, isOnTop])

  useEffect(() => {
    if (pathname !== '/') return
    returnHrefRef.current = location.search ? `/?${location.search}` : '/'
  }, [pathname, location.search])

  const handleSearchChange = useCallback((search: string, drawerOpen: boolean) => {
    setLocation((prev) =>
      prev.search === search && prev.drawerOpen === drawerOpen ? prev : { search, drawerOpen },
    )
  }, [])

  const refresh = useCallback(async (options?: { open?: boolean }) => {
    let next: PrivateIndexData | null = null
    try {
      const res = await fetch('/api/access/index', {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = (await res.json()) as { index?: PrivateIndexData | null }
        next = data.index ?? null
      }
    } catch {
      next = null
    }
    if (options?.open) {
      storeOpen(true)
      setWantOpen(true)
    }
    setIndex(next)
    return next
  }, [])

  useEffect(() => {
    setWantOpen(readStoredOpen())
    void refresh()
  }, [refresh])

  const clear = useCallback(() => {
    storeOpen(null)
    setIndex(null)
    setWantOpen(true)
  }, [])

  // The page being left is gone once the route changes.
  useEffect(() => {
    setIsLeaving(false)
    return () => {
      if (leaveTimerRef.current !== null) {
        window.clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
    }
  }, [pathname])

  const leaveTo = useCallback(
    (url: string) => {
      const revealsIndex = isOpenRef.current && url === '/' && pathname !== '/'
      if (!revealsIndex || prefersReducedMotion()) {
        router.push(url, { scroll: false })
        return
      }
      if (leaveTimerRef.current !== null) return
      setIsLeaving(true)
      router.prefetch('/')
      leaveTimerRef.current = window.setTimeout(() => {
        leaveTimerRef.current = null
        router.push('/', { scroll: false })
      }, DRAWER_SLIDE_MS)
    },
    [pathname, router],
  )

  const closeIndex = useCallback(() => {
    storeOpen(false)
    setWantOpen(false)
  }, [])

  /** Floating button: bring the Index back from wherever the viewer is. */
  const showIndex = useCallback(() => {
    if (isOnTop) {
      contentRef.current
        ?.closest('.drawer-container')
        ?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      return
    }
    storeOpen(true)
    setWantOpen(true)
    if (pathname === '/') {
      // Home drawers follow the URL and slide closed on their own.
      if (location.search) router.push('/', { scroll: false })
      return
    }
    leaveTo('/')
  }, [isOnTop, pathname, location.search, router, leaveTo])

  const value = useMemo<PrivateIndexContextValue>(
    () => ({
      index,
      isOpen,
      isOnTop,
      isLeaving,
      wasOnTop: () => wasOnTopRef.current,
      getReturnHref: () => returnHrefRef.current,
      refresh,
      clear,
      leaveTo,
    }),
    [index, isOpen, isOnTop, isLeaving, refresh, clear, leaveTo],
  )

  return (
    <PrivateIndexContext.Provider value={value}>
      <Suspense fallback={null}>
        <HomeSearchWatcher onChange={handleSearchChange} />
      </Suspense>

      {/* Before the route's own drawers in DOM order, so they stack above it at the same z-index. */}
      {index ? (
        <Drawer
          isOpen={isOpen}
          covered={covered}
          onClose={closeIndex}
          onLogoClick={closeIndex}
          breadcrumbs={[
            index.headerTitle
              ? { label: index.headerTitle, current: true }
              : { label: 'Home', onClick: closeIndex },
          ]}
          contentPadding="p-0"
          maxWidth=""
        >
          <div ref={contentRef} className="px-4">
            <PrivateIndexContent content={index.content} />
          </div>
        </Drawer>
      ) : null}

      {children}

      {index ? (
        <button
          type="button"
          className="chrome-index-fab"
          onClick={showIndex}
          aria-label={`Back to ${index.title}`}
        >
          {index.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={index.logoUrl} alt="" className="chrome-index-fab__logo" />
          ) : null}
          <span>Index</span>
        </button>
      ) : null}
    </PrivateIndexContext.Provider>
  )
}
