export type RoomStartCounts = {
  free: number
  dinner: number
  movie: number
}

export type StripeCounts = {
  available: boolean
  truncated?: boolean
  dinner?: number
  movie?: number
  premium?: number
  extend?: number
  other?: number
}

export type FeedbackRow = {
  id: string
  rating: string
  note: string
  room: string
  plan?: string
  source?: string
  at: number
}

export type StatsPayload = {
  roomStarts: RoomStartCounts
  stripe: StripeCounts
  feedback: FeedbackRow[]
}

const KEY_STORAGE = 'pd-stats-key'

function statsUrl(origin: string) {
  return `${origin.replace(/\/$/, '')}/api/stats`
}

function endpoints() {
  if (typeof window === 'undefined') return ['/api/stats']
  const origin = window.location.origin.replace(/\/$/, '')
  if (origin === 'https://proximatedate.com') return [statsUrl('https://www.proximatedate.com')]
  return [statsUrl(origin)]
}

export function readStoredStatsKey() {
  if (typeof window === 'undefined') return ''
  try {
    return sessionStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function storeStatsKey(key: string) {
  if (typeof window === 'undefined') return
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key)
    else sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

export function stripStatsKeyFromAddress() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('key')) return
  url.searchParams.delete('key')
  const qs = url.searchParams.toString()
  window.history.replaceState({}, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`)
}

export async function fetchPrivateStats(key: string): Promise<
  { ok: true; data: StatsPayload } | { ok: false; status: number; error?: string }
> {
  let lastStatus = 0
  let lastError: string | undefined
  for (const url of endpoints()) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'x-stats-key': key },
        cache: 'no-store',
      })
      lastStatus = response.status
      const text = await response.text()
      let parsed: { error?: string } & Partial<StatsPayload> = {}
      try {
        parsed = JSON.parse(text) as { error?: string } & Partial<StatsPayload>
      } catch {
        parsed = {}
      }
      if (response.ok && parsed.roomStarts && parsed.stripe) {
        return {
          ok: true,
          data: {
            roomStarts: parsed.roomStarts,
            stripe: parsed.stripe,
            feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
          },
        }
      }
      lastError = parsed.error
      if (response.status === 401 || response.status === 503) {
        return { ok: false, status: response.status, error: parsed.error }
      }
    } catch {
      continue
    }
  }
  return { ok: false, status: lastStatus || 0, error: lastError }
}
