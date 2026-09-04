const STORAGE = 'pd-first-date-used'
const COOKIE = 'pd_first_paid'
const PAID_KEYS = ['pd-paid-dinner', 'pd-paid-movie', 'pd-paid-premium']

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return ''
}

function writeYearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=1; path=/; max-age=31536000; SameSite=Lax`
}

/** True after a successful paid dinner / movie / premium checkout in this browser. */
export function hasUsedFirstDateOffer() {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(STORAGE) === '1') return true
  } catch {
    /* private mode */
  }
  if (readCookie(COOKIE) === '1') return true
  try {
    if (PAID_KEYS.some((key) => sessionStorage.getItem(key) === '1')) return true
  } catch {
    /* private mode */
  }
  return false
}

export function markFirstDateUsed() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE, '1')
  } catch {
    /* private mode */
  }
  writeYearCookie(COOKIE)
}

export function firstDateStillOpen() {
  return !hasUsedFirstDateOffer()
}
