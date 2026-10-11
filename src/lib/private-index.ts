/** Optional bespoke "Index" page attached to a password-access entry. */

export interface PrivateIndexRow {
  is_active?: boolean | null
  index_enabled?: boolean | null
  index_title?: string | null
  index_content?: string | null
  index_logo_url?: string | null
}

/** What the signed-in viewer's browser receives. */
export interface PrivateIndexData {
  title: string
  content: string
  logoUrl: string
}

export const PRIVATE_INDEX_DEFAULT_TITLE = 'Index'

export function hasPrivateIndex(row: PrivateIndexRow | null | undefined): boolean {
  return (
    !!row &&
    row.is_active !== false &&
    row.index_enabled === true &&
    !!row.index_content?.trim()
  )
}

export function toPrivateIndexData(row: PrivateIndexRow | null | undefined): PrivateIndexData | null {
  if (!row || !hasPrivateIndex(row)) return null
  return {
    title: row.index_title?.trim() || PRIVATE_INDEX_DEFAULT_TITLE,
    content: row.index_content ?? '',
    logoUrl: row.index_logo_url?.trim() || '',
  }
}
