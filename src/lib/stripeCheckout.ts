export type PaidPlanId = 'dinner' | 'movie' | 'premium' | 'extend'

const ALLOWED_RETURN = new Set(['/restaurant', '/movie-night', '/date-room', '/date-night', '/pricing'])
const PRODUCTION_CHECKOUT = 'https://www.proximatedate.com/api/create-checkout'

function checkoutUrls() {
  const urls = ['/api/create-checkout']
  if (typeof window === 'undefined') return urls
  const origin = window.location.origin.replace(/\/$/, '')
  if (origin !== 'https://www.proximatedate.com' && origin !== 'https://proximatedate.com') {
    urls.push(PRODUCTION_CHECKOUT)
  }
  return urls
}

export async function startStripeCheckout(
  planId: PaidPlanId,
  options?: { returnTo?: string; cancelTo?: string },
): Promise<'redirected' | 'waitlist'> {
  const path = options?.returnTo?.split('?')[0] ?? ''
  const returnTo = path && ALLOWED_RETURN.has(path) ? options?.returnTo : undefined
  const payload = JSON.stringify({
    plan: planId,
    returnTo,
    cancelTo: options?.cancelTo,
  })

  for (const url of checkoutUrls()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      if (response.status === 503 || response.status === 404) continue
      if (!response.ok) continue
      const data = (await response.json()) as { url?: string }
      if (!data.url) continue
      window.location.assign(data.url)
      return 'redirected'
    } catch {
      continue
    }
  }
  return 'waitlist'
}
