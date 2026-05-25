export async function fetchStatsJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, { credentials: 'same-origin', signal })
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = (await res.json()) as { error?: string }
        if (body.error) detail = body.error
      } catch {
        // ignore non-json body
      }
      return { data: null, error: detail || `HTTP ${res.status}` }
    }
    const data = (await res.json()) as T
    return { data, error: null }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { data: null, error: null }
    }
    const message = err instanceof Error ? err.message : 'Failed to fetch'
    return { data: null, error: message }
  }
}
