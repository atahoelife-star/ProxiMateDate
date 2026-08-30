import { useState } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldSkipArrival(storageKey: string) {
  if (typeof window === 'undefined') return true
  const params = new URLSearchParams(window.location.search)
  if (params.get('arrive') === '1') return false
  if (prefersReducedMotion()) return true
  if (params.get('skipArrival') === '1') return true
  if (params.get('follow') === '1') return true
  const watch = params.get('watch')
  if (watch && watch !== 'open') return true
  try {
    return sessionStorage.getItem(storageKey) === 'done'
  } catch {
    return false
  }
}

export function markArrived(storageKey: string) {
  try {
    sessionStorage.setItem(storageKey, 'done')
  } catch {
    /* private mode */
  }
}

export function useArrivalGate(storageKey: string) {
  const [ready, setReady] = useState(() => shouldSkipArrival(storageKey))
  return { arrived: ready, markArrived: () => setReady(true) }
}
