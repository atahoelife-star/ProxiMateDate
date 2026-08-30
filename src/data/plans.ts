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
    description: 'Free for 30 minutes, then $2.99 to extend.',
    features: [
      'Private chat',
      'Invite link (copy URL)',
      '30 minutes free — host can extend $2.99',
      'No menus',
      'No movie player',
    ],
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
    description: 'Pay $9.99 with a card on Stripe. Then walk in and sit down. 90 minutes at the table.',
    features: [
      'Walk-in, then a seated 1x dining room',
      '90 minutes after you sit',
      'Verdant Ember + Silver Sage at one table',
      'Dish-matched waiter clips',
      'Pay with a card on Stripe',
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
    description: 'Pay $14.99 with a card on Stripe. Then Watch Together for 2.5 hours.',
    features: [
      'Walk-in: tickets, lobby, popcorn, seats',
      '2.5 hours in the theater',
      'Official YouTube IFrame Player',
      'Floating chat while a video plays',
      'Pay with a card on Stripe',
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
    description: 'Dinner + movie in one payment. Unlocks both paid rooms for 3 hours in this browser.',
    features: [
      'Restaurant Date and Movie Night',
      '3 hours covering both rooms',
      'Pay with a card on Stripe',
      'One payment unlocks both rooms in this browser',
    ],
    cta: 'Pay $24.99 with Stripe',
    roomPath: '/date-room',
    roomCta: 'Both rooms after payment',
  },
]
