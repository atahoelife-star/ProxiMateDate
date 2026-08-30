export type PaidPlanId = 'dinner' | 'movie' | 'premium'

const ALLOWED_RETURN = new Set(['/restaurant', '/movie-night', '/date-room', '/date-night', '/pricing'])

export async function startStripeCheckout(
  planId: PaidPlanId,
  options?: { returnTo?: string; cancelTo?: string },
): Promise<'redirected' | 'waitlist'> {
  try {
    const returnTo = options?.returnTo && ALLOWED_RETURN.has(options.returnTo.split('?')[0] ?? '')
      ? options.returnTo
      : undefined
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: planId,
        returnTo,
        cancelTo: options?.cancelTo,
      }),
    })
    if (response.status === 503 || response.status === 404) return 'waitlist'
    if (!response.ok) return 'waitlist'
    const data = (await response.json()) as { url?: string }
    if (!data.url) return 'waitlist'
    window.location.assign(data.url)
    return 'redirected'
  } catch {
    return 'waitlist'
  }
}
