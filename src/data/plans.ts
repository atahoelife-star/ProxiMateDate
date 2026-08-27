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
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Candlelight Chat',
    price: 'Free',
    period: 'open now',
    popular: false,
    description: 'The date room is unlocked — no payment',
    features: [
      'Both restaurant menus at one table',
      'Waiter serving videos',
      'YouTube watch-together',
      'Companion mode for Netflix-class apps',
    ],
    cta: 'Open the date room',
  },
  {
    id: 'dinner',
    name: 'Virtual Dinner Date',
    price: '$9.99',
    period: 'one time',
    popular: true,
    description: 'When Stripe is configured, this opens Checkout. The preview date room stays free.',
    features: [
      'Same mixed vegan + steakhouse table',
      'Waiter serving clips',
      'Chat stays with the order',
      'Paid via Stripe Checkout — never a card form on this site',
    ],
    cta: 'Pay $9.99 with Stripe',
  },
  {
    id: 'movie',
    name: 'Movie Night',
    price: '$14.99',
    period: 'one time',
    popular: false,
    description: 'YouTube watch-together is already in the free date room',
    features: [
      'Official YouTube IFrame Player',
      'Host/follower tiles',
      'Companion mode for other streamers',
      'Stripe Checkout when the secret key is set',
    ],
    cta: 'Pay $14.99 with Stripe',
  },
  {
    id: 'premium',
    name: 'Premium Romance',
    price: '$24.99',
    period: 'one time',
    popular: false,
    description: 'Dinner + movie support, charged only through Stripe',
    features: [
      'Everything in the open date room',
      'No card numbers collected on proximatedate.com',
      'If Stripe is not configured, we take an email waitlist',
    ],
    cta: 'Pay $24.99 with Stripe',
  },
]
