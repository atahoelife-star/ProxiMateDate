import { useState } from 'react'

const KEY = 'pd-carnival-tokens'
export const TOKEN_PACK = 10
export const TOKEN_PACK_PRICE = '$1.00'
export const PLAY_COST = 2

function readTokens() {
  try {
    const n = Number(localStorage.getItem(KEY) || '0')
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function writeTokens(n: number) {
  try {
    localStorage.setItem(KEY, String(Math.max(0, n)))
  } catch {
    /* private mode */
  }
}

export function addCarnivalTokens(n: number) {
  const next = readTokens() + n
  writeTokens(next)
  return next
}

export function spendCarnivalTokens(n: number) {
  const have = readTokens()
  if (have < n) return false
  writeTokens(have - n)
  return true
}

/** Stripe success lands with ?paid=1&plan=tokens. Keep carnival ?paid=1. */
export function consumeTokenReturn() {
  if (typeof window === 'undefined') return readTokens()
  const params = new URLSearchParams(window.location.search)
  const pack = params.get('tokens') === '1' || params.get('plan') === 'tokens'
  if (pack) {
    addCarnivalTokens(TOKEN_PACK)
    params.delete('tokens')
    params.delete('plan')
    if (!params.get('paid')) params.set('paid', '1')
    const qs = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }
  return readTokens()
}

export function useCarnivalTokens() {
  const [tokens, setTokens] = useState(consumeTokenReturn)

  const refresh = () => setTokens(readTokens())

  const spend = (n: number) => {
    const ok = spendCarnivalTokens(n)
    if (ok) setTokens(readTokens())
    return ok
  }

  const grantPack = () => {
    setTokens(addCarnivalTokens(TOKEN_PACK))
  }

  return { tokens, spend, grantPack, refresh }
}
