import { firstDateStillOpen } from './firstDateOffer'

export type PaidPlanId = 'dinner' | 'movie' | 'premium' | 'extend'

export type CheckoutResult = 'redirected' | 'waitlist' | 'error'

const ALLOWED_RETURN = new Set(['/restaurant', '/movie-night', '/date-room', '/date-night', '/pricing'])
const PRODUCTION_CHECKOUT = 'https://www.proximatedate.com/api/create-checkout'

function checkoutUrls() {
  const urls: string[] = []
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    if (origin === 'https://proximatedate.com') {
      urls.push(PRODUCTION_CHECKOUT)
      return urls
    }
    urls.push(`${origin}/api/create-checkout`)
  } else {
    urls.push('/api/create-checkout')
  }
  if (!urls.includes(PRODUCTION_CHECKOUT)) urls.push(PRODUCTION_CHECKOUT)
  return urls
}

async function readCheckout(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as { url?: string; error?: string }
  } catch {
    return {} as { url?: string; error?: string }
  }
}

/** Same Stripe Checkout path for dinner, movie, premium, and the $2.99 free-date extend. */
export async function startStripeCheckout(
  planId: PaidPlanId,
  options?: { returnTo?: string; cancelTo?: string },
): Promise<CheckoutResult> {
  const path = options?.returnTo?.split('?')[0] ?? ''
  const returnTo = path && ALLOWED_RETURN.has(path) ? options?.returnTo : undefined
  const firstDate = planId !== 'extend' && firstDateStillOpen()
  const payload = JSON.stringify({
    plan: planId,
    returnTo,
    cancelTo: options?.cancelTo,
    firstDate,
  })

  let keyMissing = false
  for (const url of checkoutUrls()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const data = await readCheckout(response)
      if (typeof data.url === 'string' && data.url.startsWith('https://checkout.stripe.com/')) {
        window.location.assign(data.url)
        return 'redirected'
      }
      if (response.status === 503 || data.error === 'not_configured') {
        keyMissing = true
        continue
      }
    } catch {
      continue
    }
  }
  return keyMissing ? 'waitlist' : 'error'
}
