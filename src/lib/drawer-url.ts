import type { ReadonlyURLSearchParams } from 'next/navigation'

/** Drawer query keys use `?key=true`; bare `?key` (empty value) is also treated as open. */
export function isDrawerParamOpen(
  params: ReadonlyURLSearchParams,
  key: string,
): boolean {
  if (!params.has(key)) return false
  const value = params.get(key)
  if (value === 'false') return false
  return value === 'true' || value === ''
}

/** Normalize bare drawer flags (`?sign-in`) to `?sign-in=true`. Returns null if unchanged. */
export function canonicalDrawerSearch(params: ReadonlyURLSearchParams): string | null {
  const next = new URLSearchParams(params.toString())
  let changed = false

  for (const [key, value] of params.entries()) {
    if (value !== '') continue
    next.set(key, 'true')
    changed = true
  }

  return changed ? next.toString() : null
}
