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
    description: 'The full date room is unlocked in your browser',
    features: [
      'Both restaurant menus at one table',
      'Waiter serving videos',
      'YouTube watch-together sync',
      'Netflix companion mode (your own accounts)',
    ],
    cta: 'Open the date room',
  },
  {
    id: 'dinner',
    name: 'Virtual Dinner Date',
    price: 'Open',
    period: 'no paywall',
    popular: true,
    description: 'Mixed vegan + steakhouse table, waiter included',
    features: [
      'The Verdant Ember and The Silver Sage together',
      'Independent plates plus shared dishes',
      'Waiter tile plays serving clips',
      'Chat stays up while you order',
    ],
    cta: 'Open dinner in the date room',
  },
  {
    id: 'movie',
    name: 'Movie Night',
    price: 'Open',
    period: 'no paywall',
    popular: false,
    description: 'Watch together in this website — nothing is locked',
    features: [
      'YouTube watch-together with play/pause/seek sync',
      'Share a room link so both browsers stay together',
      'Netflix companion mode (not embedded)',
      'Date-room chat beside the player',
    ],
    cta: 'Open watch together',
  },
  {
    id: 'premium',
    name: 'Whole evening',
    price: 'Open',
    period: 'no paywall',
    popular: false,
    description: 'Menus, waiter, and watch-together — all free for now',
    features: [
      'Everything in Dinner + Movie',
      'AI companion personalities (scripted preview)',
      'No Stripe, no card form, no lock',
      'Optional email list for later accounts',
    ],
    cta: 'Open the full date room',
  },
]
