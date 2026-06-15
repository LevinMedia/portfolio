export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://levinmedia.com').replace(/\/$/, '')
}

/** Turn a site path into a full URL for display (e.g. admin activity logs). */
export function toFullSiteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalized}`
}
