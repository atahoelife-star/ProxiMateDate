import { useEffect, useState } from 'react'
import { CARNIVAL_BUDGET_LABEL, CARNIVAL_SESSION_MS } from '../data/carnival'
import {
  PAID_WRAP_MS,
  formatRemaining,
  remainingFromStart,
  resolveSessionStart,
} from './dateClock'
import { followFromWindow } from './roomSession'

const startKey = (roomId: string) => `pd-session-carnival-start:${roomId}`

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

function peekStart(roomId: string, fromQuery = 0) {
  const key = startKey(roomId)
  const existing = readNumber(key, 0)
  const candidates = [existing, fromQuery].filter((n) => Number.isFinite(n) && n > 0)
  const start = candidates.length ? Math.min(...candidates) : 0
  if (start > 0 && start !== existing) writeNumber(key, start)
  return start
}

type ClockOpts = {
  isHost: boolean
  remoteStartedAt?: number
}

export type CarnivalSessionState = {
  remainingMs: number
  remainingLabel: string
  expired: boolean
  wrap: boolean
  waiting: boolean
  isHost: boolean
  startedAt: number
  budgetLabel: string
}

export function useCarnivalSession(roomId: string, opts?: ClockOpts): CarnivalSessionState {
  const isHost = opts?.isHost ?? !followFromWindow()
  const remoteStartedAt = opts?.remoteStartedAt ?? 0
  const [now, setNow] = useState(() => {
    peekStart(roomId, remoteStartedAt)
    return Date.now()
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    peekStart(roomId, remoteStartedAt)
  }, [roomId, remoteStartedAt])

  const start = resolveSessionStart({
    isHost,
    remoteStartedAt,
    queryStartedAt: startedFromQuery(),
    cachedStartedAt: readNumber(startKey(roomId), 0),
  })
  if (start > 0) peekStart(roomId, start)
  const { remainingMs, waiting } = remainingFromStart(CARNIVAL_SESSION_MS, start, now)

  return {
    remainingMs,
    remainingLabel: formatRemaining(remainingMs, 'hours'),
    expired: !waiting && remainingMs <= 0,
    wrap: !waiting && remainingMs > 0 && remainingMs <= PAID_WRAP_MS,
    waiting,
    isHost,
    startedAt: start,
    budgetLabel: CARNIVAL_BUDGET_LABEL,
  }
}
