import type { Course, OrderLine, RestaurantId } from './menus'

export type WaiterClip = 'idle' | 'greet' | 'wine' | 'vegan' | 'steak' | 'champagne' | 'dessert'

/** Evening atmosphere, earliest to latest. Greet shares the idle file (no waiter-greet.mp4 on disk). */
export const EVENING_STAGES: WaiterClip[] = ['idle', 'greet', 'wine', 'vegan', 'steak', 'champagne', 'dessert']

export const WAITER_CLIPS: Record<
  WaiterClip,
  { src: string; label: string; presenceLabel: string }
> = {
  idle: {
    src: '/videos/waiter-idle.mp4',
    label: 'At your table',
    presenceLabel: 'At your table',
  },
  greet: {
    src: '/videos/waiter-idle.mp4',
    label: 'Arriving',
    presenceLabel: 'Ready for your order',
  },
  wine: {
    src: '/videos/waiter-pour-wine.mp4',
    label: 'Pouring wine',
    presenceLabel: 'Wine on the table',
  },
  vegan: {
    src: '/videos/waiter-vegan.mp4',
    label: 'Setting a plant plate',
    presenceLabel: 'Verdant Ember at the table',
  },
  steak: {
    src: '/videos/waiter-steak.mp4',
    label: 'Serving steak',
    presenceLabel: 'Steak on the table',
  },
  champagne: {
    src: '/videos/waiter-pour-champagne.mp4',
    label: 'Pouring champagne',
    presenceLabel: 'Champagne on the table',
  },
  dessert: {
    src: '/videos/waiter-dessert.mp4',
    label: 'Serving dessert',
    presenceLabel: 'Dessert at the table',
  },
}

export const RESTAURANT_OVERLOOK_SRC = '/videos/restaurant-overlook.mp4'

/** Source clips are ~7–14s; hold service on that clip for this long (repeat/loop) before settling. */
export const MIN_SERVICE_MS = 24_000

const STEAK_ITEM_IDS = new Set([
  'ss-carpaccio',
  'ss-foie',
  'ss-filet',
  'ss-ribeye',
  'ss-tomahawk',
  'ss-surf',
])

export function stageIndex(clip: WaiterClip): number {
  return EVENING_STAGES.indexOf(clip)
}

export function laterStage(current: WaiterClip, incoming: WaiterClip): WaiterClip {
  return stageIndex(incoming) > stageIndex(current) ? incoming : current
}

/**
 * Video to play for a call/order. Never visually rewind Call Waiter to the first
 * idle/greet loop. Food and drinks always play the matching serving clip.
 */
export function clipToPlay(presence: WaiterClip, requested: WaiterClip): WaiterClip {
  if (requested === 'idle' || requested === 'greet') {
    return presence === 'idle' ? 'greet' : presence
  }
  return requested
}

/** After a serving beat, stay on what just played — never snap back to idle. */
export function presenceAfterService(presence: WaiterClip, played: WaiterClip): WaiterClip {
  if (played === 'idle' || played === 'greet') {
    return presence === 'idle' ? 'greet' : presence
  }
  return played
}

export function clipForOrder(line: {
  course: Course
  restaurantId: RestaurantId
  itemId: string
}): WaiterClip {
  if (line.course === 'dessert') return 'dessert'
  if (line.restaurantId === 'verdant-ember') return 'vegan'
  if (STEAK_ITEM_IDS.has(line.itemId)) return 'steak'
  return 'vegan'
}

export function clipForTable(lines: Pick<OrderLine, 'course' | 'restaurantId' | 'itemId'>[]): WaiterClip {
  if (lines.some((l) => clipForOrder(l) === 'dessert')) return 'dessert'
  if (lines.some((l) => clipForOrder(l) === 'steak')) return 'steak'
  if (lines.some((l) => clipForOrder(l) === 'vegan')) return 'vegan'
  return 'vegan'
}

export function clipForMenuCourse(course: Course): WaiterClip {
  return course === 'dessert' ? 'dessert' : 'vegan'
}
