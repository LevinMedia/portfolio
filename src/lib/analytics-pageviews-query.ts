import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

export type PublicAnalyticsPageview = {
  occurred_at: string
  visitor_id: string
  path?: string
  country?: string | null
  region?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
}

/** Fetch all matching public analytics rows (Supabase caps each request at 1000). */
export async function fetchPublicAnalyticsPageviews(
  supabase: SupabaseClient,
  options: {
    start?: Date | null
    end?: Date | null
    select: string
  },
): Promise<PublicAnalyticsPageview[]> {
  const { start, end, select } = options
  const rows: PublicAnalyticsPageview[] = []
  let offset = 0

  while (true) {
    let q = supabase
      .from('analytics_pageviews')
      .select(select)
      .eq('is_bot', false)
      .eq('is_admin', false)
      .eq('is_private', false)
      .order('occurred_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (start) q = q.gte('occurred_at', start.toISOString())
    if (end) q = q.lte('occurred_at', end.toISOString())

    const { data, error } = await q
    if (error) throw new Error(error.message)

    const batch = (data ?? []) as unknown as PublicAnalyticsPageview[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return rows
}
