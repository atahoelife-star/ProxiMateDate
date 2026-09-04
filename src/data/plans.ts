import { LIST_DURATION, LIST_PRICE } from './prices'

export type PlanId = 'free' | 'dinner' | 'movie' | 'premium'

export type Plan = {
  id: PlanId
  name: string
  price: string
  duration: string
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
    duration: 'for 30 minutes',
    popular: false,
    description: 'Free for 30 minutes. Then $2.99 to extend.',
    features: [
      'Private chat',
      'Invite link (copy URL)',
      'Free for 30 minutes. Host can extend for $2.99',
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
    price: LIST_PRICE.dinner,
    duration: LIST_DURATION.dinner,
    popular: true,
    description: `Pay ${LIST_PRICE.dinner} with a card on Stripe. Then walk in and sit down for 90 minutes at the table.`,
    features: [
      'Walk-in, then a seated 1x dining room',
      '90 minutes after you sit',
      'Verdant Ember + Silver Sage at one table',
      'Dish-matched waiter clips',
      'Pay with a card on Stripe',
    ],
    cta: `Pay ${LIST_PRICE.dinner} with Stripe`,
    roomPath: '/restaurant',
    roomCta: 'Open restaurant',
  },
  {
    id: 'movie',
    name: 'Movie Night',
    price: LIST_PRICE.movie,
    duration: LIST_DURATION.movie,
    popular: false,
    description: `Pay ${LIST_PRICE.movie} with a card on Stripe. Then Watch Together for 2.5 hours.`,
    features: [
      'Walk-in: tickets, lobby, popcorn, seats',
      '2.5 hours in the theater',
      'Official YouTube IFrame Player',
      'Floating chat while a video plays',
      'Pay with a card on Stripe',
    ],
    cta: `Pay ${LIST_PRICE.movie} with Stripe`,
    roomPath: '/movie-night',
    roomCta: 'Open movie night',
  },
  {
    id: 'premium',
    name: 'Premium Romance',
    price: LIST_PRICE.premium,
    duration: LIST_DURATION.premium,
    popular: false,
    description: 'Dinner + movie in one payment. Unlocks both paid rooms for 3 hours in this browser.',
    features: [
      'Restaurant Date and Movie Night',
      '3 hours covering both rooms',
      'Pay with a card on Stripe',
      'One payment unlocks both rooms in this browser',
    ],
    cta: `Pay ${LIST_PRICE.premium} with Stripe`,
    roomPath: '/date-room',
    roomCta: 'Both rooms after payment',
  },
]
