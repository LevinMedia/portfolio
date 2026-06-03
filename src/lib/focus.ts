const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function isVisible(el: HTMLElement): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false
  return el.getClientRects().length > 0
}

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
}

export function getFirstFocusable(root: HTMLElement): HTMLElement | null {
  return getFocusableElements(root)[0] ?? null
}

export function getLastFocusable(root: HTMLElement): HTMLElement | null {
  const list = getFocusableElements(root)
  return list[list.length - 1] ?? null
}

/** Focus the first tabbable element in `root`, retrying until content mounts (e.g. loaders). */
export function focusFirstWhenReady(
  root: HTMLElement | null,
  opts?: { timeoutMs?: number },
): () => void {
  if (!root) return () => {}

  const timeoutMs = opts?.timeoutMs ?? 10_000

  const tryFocus = () => {
    const first = getFirstFocusable(root)
    if (!first) return false
    first.focus({ preventScroll: true })
    return true
  }

  if (tryFocus()) return () => {}

  const mo = new MutationObserver(() => {
    if (tryFocus()) mo.disconnect()
  })
  mo.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'disabled', 'tabindex', 'aria-hidden'],
  })

  const timer = window.setTimeout(() => mo.disconnect(), timeoutMs)
  return () => {
    mo.disconnect()
    window.clearTimeout(timer)
  }
}
