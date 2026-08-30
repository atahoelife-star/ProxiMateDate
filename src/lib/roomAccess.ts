import { useState } from 'react'
import type { PaidPlanId } from './stripeCheckout'

const DINNER_KEY = 'pd-paid-dinner'
const MOVIE_KEY = 'pd-paid-movie'
const PREMIUM_KEY = 'pd-paid-premium'

export type PaidRoom = 'dinner' | 'movie'

/** Free Date Night is never gated. Only restaurant and movie night use this. */

const FRESH_DINNER_ARRIVAL = 'pd-fresh-dinner-arrival'
let dinnerArrivalForced = false

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
  if (plan === 'extend') return
  if (plan === 'premium') {
    writeFlag(PREMIUM_KEY)
    writeFlag(DINNER_KEY)
    writeFlag(MOVIE_KEY)
    return
  }
  if (plan === 'dinner') writeFlag(DINNER_KEY)
  if (plan === 'movie') writeFlag(MOVIE_KEY)
}

/** Stripe success / QA `?paid=1` skips the paywall only — not the dining-room tour. */
export function markFreshDinnerArrival() {
  dinnerArrivalForced = true
  try {
    sessionStorage.setItem(FRESH_DINNER_ARRIVAL, '1')
  } catch {
    /* private mode */
  }
}

export function shouldForceDinnerArrival() {
  if (dinnerArrivalForced) return true
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('paid') === '1') return true
  try {
    return sessionStorage.getItem(FRESH_DINNER_ARRIVAL) === '1'
  } catch {
    return false
  }
}

export function clearFreshDinnerArrival() {
  dinnerArrivalForced = false
  try {
    sessionStorage.removeItem(FRESH_DINNER_ARRIVAL)
  } catch {
    /* private mode */
  }
}

function isFollowerJoin() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('follow') === '1'
}

export function hasPremiumAccess() {
  return readFlag(PREMIUM_KEY)
}

export function hasRoomAccess(room: PaidRoom) {
  if (isFollowerJoin()) return true
  if (hasPremiumAccess()) return true
  if (room === 'dinner') return readFlag(DINNER_KEY)
  return readFlag(MOVIE_KEY)
}

function planFromQuery(raw: string | null, fallback: PaidRoom): PaidPlanId {
  if (raw === 'premium' || raw === 'dinner' || raw === 'movie' || raw === 'extend') return raw
  return fallback
}

/** Stripe success lands with ?paid=1&plan=… — grant this browser, then strip the query. */
export function consumePaidReturn(room: PaidRoom) {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('paid') !== '1') return hasRoomAccess(room)
  const plan = planFromQuery(params.get('plan'), room)
  grantPaidPlan(plan)
  if (room === 'dinner' || plan === 'dinner' || plan === 'premium') markFreshDinnerArrival()
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
  const plan = planFromQuery(params.get('plan'), 'dinner')
  grantPaidPlan(plan)
  if (plan === 'dinner' || plan === 'premium') markFreshDinnerArrival()
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
