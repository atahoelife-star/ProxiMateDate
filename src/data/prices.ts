export const LIST_PRICE = {
  dinner: '$7.99',
  movie: '$11.99',
  premium: '$19.99',
  extend: '$2.99',
} as const

export const FIRST_DATE_PRICE = {
  dinner: '$3.99',
  movie: '$5.99',
  premium: '$9.99',
} as const

export const LIST_DURATION = {
  dinner: 'for 90 minutes',
  movie: 'for 2.5 hours',
  premium: 'for 3 hours',
  extend: 'for 30 more minutes',
} as const

export type PaidEveningId = keyof typeof FIRST_DATE_PRICE

export function payCta(plan: PaidEveningId, firstDate: boolean) {
  const amount = firstDate ? FIRST_DATE_PRICE[plan] : LIST_PRICE[plan]
  return firstDate ? `Pay ${amount} with Stripe — first date` : `Pay ${amount} with Stripe`
}
