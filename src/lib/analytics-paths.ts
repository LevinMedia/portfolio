/** Virtual drawer paths and standalone site routes (not selected-work slugs). */
export const ANALYTICS_SITE_PATHS = new Set([
  '/',
  '/about',
  '/access',
  '/guestbook',
  '/sign-in',
  '/site-settings',
  '/stats',
  '/work-history',
  '/selected-works',
  '/field-notes',
])

const ANALYTICS_SITE_SEGMENTS = new Set(
  [...ANALYTICS_SITE_PATHS]
    .filter((path) => path.length > 1)
    .map((path) => path.slice(1)),
)

/** Auth routes omitted from public top-pages reporting. */
const ANALYTICS_STATS_EXCLUDED_PATHS = new Set(['/sign-in', '/access'])

/** Published, non-private featured-work and field-note slugs that exist on this site. */
export type PublicStatsSlugs = {
  workSlugs: ReadonlySet<string>
  noteSlugs: ReadonlySet<string>
}

function ensureLeadingSlash(path: string): string {
  if (!path) return '/'
  const withSlash = path.startsWith('/') ? path : `/${path}`
  if (withSlash.length > 1 && withSlash.endsWith('/')) return withSlash.slice(0, -1)
  return withSlash
}

/**
 * Normalize stored analytics paths for display and full URL building.
 * Repairs legacy rows that were incorrectly prefixed with /selected-works/.
 */
export function normalizeAnalyticsPathForDisplay(
  path: string,
  workSlugs: ReadonlySet<string> = new Set(),
): string {
  const p = ensureLeadingSlash(path)

  if (ANALYTICS_SITE_PATHS.has(p)) return p

  if (p.startsWith('/selected-works/')) {
    const segment = p.slice('/selected-works/'.length).split('/')[0]
    if (!segment) return '/selected-works'
    if (workSlugs.has(segment)) return p
    if (ANALYTICS_SITE_SEGMENTS.has(segment)) {
      return segment === 'selected-works' ? '/selected-works' : `/${segment}`
    }
    return p
  }

  if (p.startsWith('/field-notes/')) return p

  const bare = p.slice(1)
  if (/^[a-z0-9-]{3,}$/.test(bare)) {
    if (ANALYTICS_SITE_SEGMENTS.has(bare)) return `/${bare}`
    if (workSlugs.has(bare)) return `/selected-works/${bare}`
  }

  return p
}

/** Returns true when a bare path segment should not be treated as a selected-work slug. */
export function isKnownAnalyticsSiteSegment(segment: string): boolean {
  return ANALYTICS_SITE_SEGMENTS.has(segment)
}

function exactSlugAfter(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null
  const rest = path.slice(prefix.length)
  if (!rest || rest.includes('/')) return null
  return rest
}

/**
 * Top pages only includes current public routes.
 * Auth pages, private content, and leftover old-site URLs are omitted.
 */
export function isExcludedFromStatsReporting(
  path: string,
  publicSlugs: PublicStatsSlugs = { workSlugs: new Set(), noteSlugs: new Set() },
): boolean {
  const p = ensureLeadingSlash(path)
  if (ANALYTICS_STATS_EXCLUDED_PATHS.has(p)) return true
  if (ANALYTICS_SITE_PATHS.has(p)) return false

  const workSlug = exactSlugAfter(p, '/selected-works/')
  if (workSlug) return !publicSlugs.workSlugs.has(workSlug)

  const noteSlug = exactSlugAfter(p, '/field-notes/')
  if (noteSlug) return !publicSlugs.noteSlugs.has(noteSlug)

  return true
}
