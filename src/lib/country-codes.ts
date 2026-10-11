/**
 * Pageviews store `country` as an ISO 3166-1 alpha-2 code when it comes from the host's geo headers,
 * but older rows written by the Accept-Language fallback hold the English name ("United States").
 * Reporting normalises both to the code so one country is one row.
 */

let codeByName: Map<string, string> | null = null

function buildCodeByName() {
  const map = new Map<string, string>()
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b
      try {
        const name = names.of(code)
        // Unassigned codes come back unchanged
        if (name && name !== code) map.set(name.toLowerCase(), code)
      } catch {
        // not a valid region subtag
      }
    }
  }
  return map
}

export function normalizeCountry(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  codeByName ??= buildCodeByName()
  return codeByName.get(trimmed.toLowerCase()) ?? trimmed
}
