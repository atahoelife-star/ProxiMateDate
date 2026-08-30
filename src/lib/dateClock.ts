/** Shared remaining-time math. Never formats elapsed. */

export const FREE_SESSION_MS = 30 * 60 * 1000
export const FREE_EXTEND_MS = 30 * 60 * 1000
export const FREE_WARN_MS = 3 * 60 * 1000

export const DINNER_SESSION_MS = 90 * 60 * 1000
export const MOVIE_SESSION_MS = Math.round(2.5 * 60 * 60 * 1000)
export const PREMIUM_SESSION_MS = 3 * 60 * 60 * 1000
export const PAID_WRAP_MS = 5 * 60 * 1000

export function earliestStart(...times: number[]) {
  const valid = times.filter((n) => Number.isFinite(n) && n > 0)
  if (valid.length === 0) return 0
  return Math.min(...valid)
}

/**
 * Host never invents a start (opening the room must not burn minutes).
 * The shared start comes from the guest entering, via the live room or invite URL.
 */
export function resolveSessionStart(opts: {
  isHost: boolean
  remoteStartedAt?: number
  queryStartedAt?: number
  cachedStartedAt?: number
}) {
  const shared = earliestStart(opts.remoteStartedAt ?? 0, opts.queryStartedAt ?? 0)
  if (shared > 0) return shared
  if (opts.isHost) return 0
  return earliestStart(opts.cachedStartedAt ?? 0)
}

/** Remaining milliseconds until the shared date ends. Elapsed is never returned. */
export function remainingFromStart(budgetMs: number, startedAt: number, now: number, extraMs = 0) {
  const total = Math.max(0, budgetMs + extraMs)
  if (!(startedAt > 0)) return { remainingMs: total, waiting: true }
  const elapsed = Math.max(0, now - startedAt)
  return { remainingMs: Math.max(0, total - elapsed), waiting: false }
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

/**
 * Countdown label. Free/dinner stay in total minutes (`30:00`, `90:00`) so 90 minutes
 * is never `1:30:00`. Movie/combo use hours (`2:30:00`, `3:00:00`).
 */
export function formatRemaining(ms: number, mode: 'minutes' | 'hours' = 'minutes') {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  if (mode === 'hours') {
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${pad(minutes)}:${pad(seconds)}`
}
