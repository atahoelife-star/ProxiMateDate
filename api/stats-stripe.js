import Stripe from 'stripe'

const PLAN_IDS = new Set(['dinner', 'movie', 'premium', 'extend'])
/** Metadata.plan wins. Amount fallback covers old list, new list, and first-date halves.
 *  999 is kept as dinner for historical $9.99 checkouts; new $9.99 premium first-dates set metadata. */
const AMOUNT_TO_PLAN = {
  399: 'dinner',
  599: 'movie',
  799: 'dinner',
  999: 'dinner',
  1199: 'movie',
  1499: 'movie',
  1999: 'premium',
  2499: 'premium',
  299: 'extend',
}

const MAX_PAGES = 8

export function emptyStripeCounts() {
  return { dinner: 0, movie: 0, premium: 0, extend: 0, other: 0 }
}

export function classifyCheckoutSession(session) {
  const plan = session?.metadata?.plan
  if (PLAN_IDS.has(plan)) return plan
  const amount = Number(session?.amount_total)
  if (AMOUNT_TO_PLAN[amount]) return AMOUNT_TO_PLAN[amount]
  return 'other'
}

export async function collectPaidCheckoutCounts() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return { available: false }

  try {
    const stripe = new Stripe(secret)
    const counts = emptyStripeCounts()
    let startingAfter
    let pages = 0
    let truncated = false

    while (pages < MAX_PAGES) {
      const list = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        starting_after: startingAfter,
      })
      for (const session of list.data) {
        if (session.payment_status !== 'paid') continue
        counts[classifyCheckoutSession(session)] += 1
      }
      pages += 1
      if (!list.has_more) break
      if (pages >= MAX_PAGES) {
        truncated = true
        break
      }
      startingAfter = list.data[list.data.length - 1]?.id
      if (!startingAfter) break
    }

    return { available: true, truncated, ...counts }
  } catch {
    return { available: false, error: 'request_failed' }
  }
}
