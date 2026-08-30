import { useEffect, useState } from 'react'
import { followFromWindow } from './roomSession'
import { hasPremiumAccess } from './roomAccess'

export const FREE_SESSION_MS = 30 * 60 * 1000
export const FREE_EXTEND_MS = 30 * 60 * 1000
export const FREE_WARN_MS = 3 * 60 * 1000

export const DINNER_SESSION_MS = 90 * 60 * 1000
export const MOVIE_SESSION_MS = Math.round(2.5 * 60 * 60 * 1000)
export const PREMIUM_SESSION_MS = 3 * 60 * 60 * 1000
export const PAID_WRAP_MS = 5 * 60 * 1000

const freeStartKey = (roomId: string) => `pd-session-free-start:${roomId}`
const freeExtraKey = (roomId: string) => `pd-session-free-extra:${roomId}`
const dinnerStartKey = (roomId: string) => `pd-session-dinner-start:${roomId}`
const movieStartKey = (roomId: string) => `pd-session-movie-start:${roomId}`
const PREMIUM_START_KEY = 'pd-session-premium-start'

function readNumber(key: string, fallback: number) {
  try {
    const raw = localStorage.getItem(key)
    const n = raw ? Number(raw) : fallback
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* private mode */
  }
}

function startedFromQuery() {
  if (typeof window === 'undefined') return 0
  const n = Number(new URLSearchParams(window.location.search).get('started'))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(n, Date.now())
}

function ensureStart(key: string, fromQuery = 0) {
  const existing = readNumber(key, 0)
  if (fromQuery > 0 && (existing === 0 || fromQuery < existing)) {
    writeNumber(key, fromQuery)
    return fromQuery
  }
  if (existing > 0) return existing
  const now = Date.now()
  writeNumber(key, now)
  return now
}

export function ensureFreeSessionStart(roomId: string) {
  return ensureStart(freeStartKey(roomId), startedFromQuery())
}

export function grantFreeExtend(roomId: string) {
  writeNumber(freeExtraKey(roomId), readNumber(freeExtraKey(roomId), 0) + FREE_EXTEND_MS)
}

export function consumeFreeExtendReturn(roomId: string) {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('paid') !== '1' || params.get('plan') !== 'extend') return false
  grantFreeExtend(roomId)
  params.delete('paid')
  params.delete('plan')
  const qs = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  return true
}

export function freeSessionBudget(roomId: string) {
  return FREE_SESSION_MS + readNumber(freeExtraKey(roomId), 0)
}

export function formatRemaining(ms: number) {
  const safe = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export type FreeSessionState = {
  remainingMs: number
  remainingLabel: string
  expired: boolean
  warn: boolean
  isHost: boolean
  startedAt: number
  extraMs: number
}

export function useFreeDateSession(roomId: string): FreeSessionState {
  const isHost = !followFromWindow()
  const [now, setNow] = useState(() => {
    consumeFreeExtendReturn(roomId)
    ensureFreeSessionStart(roomId)
    return Date.now()
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [roomId])

  const start = ensureFreeSessionStart(roomId)
  const extraMs = readNumber(freeExtraKey(roomId), 0)
  const remainingMs = FREE_SESSION_MS + extraMs - (now - start)
  return {
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
    expired: remainingMs <= 0,
    warn: remainingMs > 0 && remainingMs <= FREE_WARN_MS,
    isHost,
    startedAt: start,
    extraMs,
  }
}

export type PaidSessionKind = 'dinner' | 'movie'

export type PaidSessionState = {
  remainingMs: number
  remainingLabel: string
  expired: boolean
  wrap: boolean
  isHost: boolean
  startedAt: number
  running: boolean
  budgetLabel: string
  combo: boolean
}

export function usePaidDateSession(kind: PaidSessionKind, roomId: string, running: boolean): PaidSessionState {
  const isHost = !followFromWindow()
  const combo = hasPremiumAccess()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const budget = combo ? PREMIUM_SESSION_MS : kind === 'dinner' ? DINNER_SESSION_MS : MOVIE_SESSION_MS
  const budgetLabel = combo ? '3 hours' : kind === 'dinner' ? '90 minutes' : '2.5 hours'
  const start = running
    ? combo
      ? ensureStart(PREMIUM_START_KEY, startedFromQuery())
      : ensureStart(kind === 'dinner' ? dinnerStartKey(roomId) : movieStartKey(roomId), startedFromQuery())
    : 0
  const remainingMs = !running || start === 0 ? budget : budget - (now - start)

  return {
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
    expired: running && start > 0 && remainingMs <= 0,
    wrap: running && start > 0 && remainingMs > 0 && remainingMs <= PAID_WRAP_MS,
    isHost,
    startedAt: start,
    running,
    budgetLabel,
    combo,
  }
}
