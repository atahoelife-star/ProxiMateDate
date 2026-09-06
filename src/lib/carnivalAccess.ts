import { useState } from 'react'

const KEY = 'pd-carnival-preview'

function readFlag() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function writeFlag() {
  try {
    sessionStorage.setItem(KEY, '1')
    sessionStorage.setItem(`${KEY}-at`, String(Date.now()))
  } catch {
    /* private mode */
  }
}

function isFollowerJoin() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('follow') === '1'
}

function hasPaidQuery() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('paid') === '1'
}

/** Preview QA only. No Stripe. Keep ?paid=1 on the URL so Gregory can copy it. */
export function hasCarnivalPreviewAccess() {
  if (isFollowerJoin()) return true
  if (hasPaidQuery()) {
    writeFlag()
    return true
  }
  return readFlag()
}

export function grantCarnivalPreview() {
  writeFlag()
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('paid', '1')
  const qs = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

export function useCarnivalPreview() {
  const [allowed, setAllowed] = useState(hasCarnivalPreviewAccess)
  const enterPreview = () => {
    grantCarnivalPreview()
    setAllowed(true)
  }
  return { allowed, enterPreview }
}
