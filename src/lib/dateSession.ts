import { useEffect, useState } from 'react'
import {
  DINNER_SESSION_MS,
  FREE_EXTEND_MS,
  FREE_SESSION_MS,
  FREE_WARN_MS,
  MOVIE_SESSION_MS,
  PAID_WRAP_MS,
  PREMIUM_SESSION_MS,
  earliestStart,
  formatRemaining,
  remainingFromStart,
} from './dateClock'
import { hasPremiumAccess } from './roomAccess'
import { followFromWindow } from './roomSession'

export {
  DINNER_SESSION_MS,
  FREE_EXTEND_MS,
  FREE_SESSION_MS,
  FREE_WARN_MS,
  MOVIE_SESSION_MS,
  PAID_WRAP_MS,
  PREMIUM_SESSION_MS,
  formatRemaining,
}

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

function peekStart(key: string, fromQuery = 0) {
  const existing = readNumber(key, 0)
  const start = earliestStart(existing, fromQuery)
  if (start > 0 && start !== existing) writeNumber(key, start)
  return start
}

function paidKey(kind: PaidSessionKind, roomId: string) {
  if (hasPremiumAccess()) return PREMIUM_START_KEY
  return kind === 'dinner' ? dinnerStartKey(roomId) : movieStartKey(roomId)
}

export function beginFreeSessionNow(roomId: string) {
  const existing = peekStart(freeStartKey(roomId), startedFromQuery())
  if (existing > 0) return existing
  const now = Date.now()
  writeNumber(freeStartKey(roomId), now)
  return now
}

export function beginPaidSessionNow(kind: PaidSessionKind, roomId: string) {
  const existing = peekStart(paidKey(kind, roomId), startedFromQuery())
  if (existing > 0) return existing
  const now = Date.now()
  writeNumber(paidKey(kind, roomId), now)
  return now
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

export function applyRemoteFreeClock(roomId: string, startedAt: number, extraMs: number) {
  if (startedAt > 0) peekStart(freeStartKey(roomId), startedAt)
  if (extraMs > 0) {
    const have = readNumber(freeExtraKey(roomId), 0)
    if (extraMs > have) writeNumber(freeExtraKey(roomId), extraMs)
  }
}

export function applyRemotePaidClock(kind: PaidSessionKind, roomId: string, startedAt: number) {
  if (startedAt <= 0) return
  peekStart(paidKey(kind, roomId), startedAt)
}

type ClockOpts = {
  isHost: boolean
  remoteStartedAt?: number
  remoteExtraMs?: number
}

export type FreeSessionState = {
  remainingMs: number
  remainingLabel: string
  expired: boolean
  warn: boolean
  waiting: boolean
  isHost: boolean
  startedAt: number
  extraMs: number
}

export function useFreeDateSession(roomId: string, opts?: ClockOpts): FreeSessionState {
  const isHost = opts?.isHost ?? !followFromWindow()
  const remoteStartedAt = opts?.remoteStartedAt ?? 0
  const remoteExtraMs = opts?.remoteExtraMs ?? 0
  const [now, setNow] = useState(() => {
    consumeFreeExtendReturn(roomId)
    applyRemoteFreeClock(roomId, remoteStartedAt, remoteExtraMs)
    return Date.now()
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [roomId])

  useEffect(() => {
    applyRemoteFreeClock(roomId, remoteStartedAt, remoteExtraMs)
  }, [roomId, remoteStartedAt, remoteExtraMs])

  const extraMs = Math.max(readNumber(freeExtraKey(roomId), 0), remoteExtraMs)
  const start = earliestStart(peekStart(freeStartKey(roomId), startedFromQuery()), remoteStartedAt)
  const { remainingMs, waiting } = remainingFromStart(FREE_SESSION_MS, start, now, extraMs)
  return {
    remainingMs,
    remainingLabel: formatRemaining(remainingMs, 'minutes'),
    expired: !waiting && remainingMs <= 0,
    warn: !waiting && remainingMs > 0 && remainingMs <= FREE_WARN_MS,
    waiting,
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
  waiting: boolean
  isHost: boolean
  startedAt: number
  running: boolean
  budgetLabel: string
  combo: boolean
}

export function usePaidDateSession(
  kind: PaidSessionKind,
  roomId: string,
  running: boolean,
  opts?: ClockOpts,
): PaidSessionState {
  const isHost = opts?.isHost ?? !followFromWindow()
  const remoteStartedAt = opts?.remoteStartedAt ?? 0
  const combo = hasPremiumAccess()
  const [now, setNow] = useState(() => {
    applyRemotePaidClock(kind, roomId, remoteStartedAt)
    return Date.now()
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    applyRemotePaidClock(kind, roomId, remoteStartedAt)
  }, [kind, roomId, remoteStartedAt])

  const budget = combo ? PREMIUM_SESSION_MS : kind === 'dinner' ? DINNER_SESSION_MS : MOVIE_SESSION_MS
  const budgetLabel = combo ? '3 hours' : kind === 'dinner' ? '90 minutes' : '2.5 hours'
  const start = earliestStart(peekStart(paidKey(kind, roomId), startedFromQuery()), remoteStartedAt)
  const { remainingMs, waiting } = remainingFromStart(budget, start, now)
  const labelMode = combo || kind === 'movie' ? 'hours' : 'minutes'

  return {
    remainingMs,
    remainingLabel: formatRemaining(remainingMs, labelMode),
    expired: !waiting && remainingMs <= 0,
    wrap: !waiting && remainingMs > 0 && remainingMs <= PAID_WRAP_MS,
    waiting,
    isHost,
    startedAt: start,
    running,
    budgetLabel,
    combo,
  }
}
