/** Stripe amounts in USD cents. Keep display strings in src/data/prices.ts in sync. */

export const LIST_AMOUNTS = {
  dinner: 799,
  movie: 1199,
  premium: 1999,
  extend: 299,
}

/** First paid evening in this browser: half the new list, rounded to a clean .99. */
export const FIRST_DATE_AMOUNTS = {
  dinner: 399,
  movie: 599,
  premium: 999,
}

export const PLAN_NAMES = {
  dinner: 'Virtual Dinner Date',
  movie: 'Movie Night',
  premium: 'Premium Romance',
  extend: 'Date Night extend',
}

export const SUCCESS_PATHS = {
  dinner: '/restaurant',
  movie: '/movie-night',
  premium: '/date-room',
  extend: '/date-night',
}

export const PAID_EVENING_PLANS = new Set(['dinner', 'movie', 'premium'])

export function isPlanId(raw) {
  return Object.prototype.hasOwnProperty.call(LIST_AMOUNTS, String(raw || ''))
}

export function checkoutAmount(planId, firstDate) {
  if (!isPlanId(planId)) return null
  if (planId !== 'extend' && firstDate) return FIRST_DATE_AMOUNTS[planId]
  return LIST_AMOUNTS[planId]
}
