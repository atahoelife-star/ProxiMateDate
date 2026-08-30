import { useState } from 'react'
import type { PaidPlanId } from './stripeCheckout'

const DINNER_KEY = 'pd-paid-dinner'
const MOVIE_KEY = 'pd-paid-movie'
const PREMIUM_KEY = 'pd-paid-premium'

export type PaidRoom = 'dinner' | 'movie'

function readFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string) {
  try {
    sessionStorage.setItem(key, '1')
    sessionStorage.setItem(`${key}-at`, String(Date.now()))
  } catch {
    /* private mode */
  }
}

export function grantPaidPlan(plan: PaidPlanId) {
  if (plan === 'premium') {
    writeFlag(PREMIUM_KEY)
    writeFlag(DINNER_KEY)
    writeFlag(MOVIE_KEY)
    return
  }
  if (plan === 'dinner') writeFlag(DINNER_KEY)
  if (plan === 'movie') writeFlag(MOVIE_KEY)
}

function isFollowerJoin() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('follow') === '1'
}

export function hasRoomAccess(room: PaidRoom) {
  if (isFollowerJoin()) return true
  if (readFlag(PREMIUM_KEY)) return true
  if (room === 'dinner') return readFlag(DINNER_KEY)
  return readFlag(MOVIE_KEY)
}

function planFromQuery(raw: string | null, fallback: PaidRoom): PaidPlanId {
  if (raw === 'premium' || raw === 'dinner' || raw === 'movie') return raw
  return fallback
}

/** Stripe success lands with ?paid=1&plan=… — grant this browser, then strip the query. */
export function consumePaidReturn(room: PaidRoom) {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('paid') !== '1') return hasRoomAccess(room)
  grantPaidPlan(planFromQuery(params.get('plan'), room))
  params.delete('paid')
  params.delete('plan')
  const qs = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  return true
}

export function consumeChooserPaidReturn() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('paid') !== '1') return false
  grantPaidPlan(planFromQuery(params.get('plan'), 'dinner'))
  params.delete('paid')
  params.delete('plan')
  const qs = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  return true
}

export function usePaidRoom(room: PaidRoom) {
  const [allowed] = useState(() => consumePaidReturn(room) || hasRoomAccess(room))
  return allowed
}
