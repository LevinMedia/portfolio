import { useEffect, type RefObject } from 'react'

/**
 * Sync drawer header title with hero h1 visibility. Observes against the drawer
 * scroll container (not the window) so scroll position matches chrome header behavior.
 */
export function useDrawerHeroTitleVisibility(
  titleRef: RefObject<HTMLElement | null>,
  onVisibilityChange: ((isVisible: boolean) => void) | undefined,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !onVisibilityChange) return

    let cancelled = false
    let observer: IntersectionObserver | undefined
    let ro: ResizeObserver | undefined
    let retryId = 0

    const connect = (titleEl: HTMLElement, scrollRoot: HTMLElement) => {
      observer?.disconnect()
      ro?.disconnect()

      const measureInset = () => {
        const header = scrollRoot.querySelector<HTMLElement>('.c64-drawer-header')
        return header ? Math.ceil(header.getBoundingClientRect().height) : 56
      }

      const attach = () => {
        if (cancelled) return
        const inset = measureInset()
        observer = new IntersectionObserver(
          ([entry]) => {
            onVisibilityChange(entry.isIntersecting)
          },
          {
            root: scrollRoot,
            rootMargin: `-${inset}px 0px 0px 0px`,
            threshold: 0,
          },
        )
        observer.observe(titleEl)
      }

      attach()
      ro = new ResizeObserver(attach)
      const header = scrollRoot.querySelector<HTMLElement>('.c64-drawer-header')
      if (header) ro.observe(header)
      ro.observe(scrollRoot)
    }

    const setup = () => {
      if (cancelled) return
      const titleEl = titleRef.current
      if (!titleEl) {
        retryId = window.requestAnimationFrame(setup)
        return
      }

      const scrollRoot = titleEl.closest('.drawer-container.drawer-chrome')
      if (!(scrollRoot instanceof HTMLElement)) return

      connect(titleEl, scrollRoot)
    }

    setup()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(retryId)
      observer?.disconnect()
      ro?.disconnect()
    }
  }, [enabled, onVisibilityChange, titleRef])
}
