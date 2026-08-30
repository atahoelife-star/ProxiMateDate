export type PlanId = 'free' | 'dinner' | 'movie' | 'premium'

export type Plan = {
  id: PlanId
  name: string
  price: string
  period: string
  popular: boolean
  description: string
  features: string[]
  cta: string
  roomPath: string
  roomCta: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Candlelight Chat',
    price: 'Free',
    period: 'open now',
    popular: false,
    description: 'Simple together time — no payment, no lock',
    features: ['Private chat', 'Invite link (copy URL)', 'No menus', 'No movie player'],
    cta: 'Open free date night',
    roomPath: '/date-night',
    roomCta: 'Open free date night',
  },
  {
    id: 'dinner',
    name: 'Virtual Dinner Date',
    price: '$9.99',
    period: 'one time',
    popular: true,
    description: 'Pay $9.99, then walk in and sit down. Card in the browser via Stripe Checkout.',
    features: [
      'Walk-in, then a seated 1x dining room',
      'Verdant Ember + Silver Sage at one table',
      'Dish-matched waiter clips',
      'Paid via Stripe Checkout — never a card form on this site',
    ],
    cta: 'Pay $9.99 with Stripe',
    roomPath: '/restaurant',
    roomCta: 'Open restaurant',
  },
  {
    id: 'movie',
    name: 'Movie Night',
    price: '$14.99',
    period: 'one time',
    popular: false,
    description: 'Pay $14.99, then Watch Together. Card in the browser via Stripe Checkout.',
    features: [
      'Walk-in: tickets, lobby, popcorn, seats',
      'Official YouTube IFrame Player',
      'Floating chat while a video plays',
      'Stripe Checkout when the secret key is set',
    ],
    cta: 'Pay $14.99 with Stripe',
    roomPath: '/movie-night',
    roomCta: 'Open movie night',
  },
  {
    id: 'premium',
    name: 'Premium Romance',
    price: '$24.99',
    period: 'one time',
    popular: false,
    description: 'Dinner + movie in one payment. Unlocks both paid rooms for this browser.',
    features: [
      'Restaurant Date and Movie Night',
      'Card via Stripe Checkout — never a form on this site',
      'If Stripe is not configured, we take an email waitlist',
    ],
    cta: 'Pay $24.99 with Stripe',
    roomPath: '/date-room',
    roomCta: 'Both rooms after payment',
  },
]
