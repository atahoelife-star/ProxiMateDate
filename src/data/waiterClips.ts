import type { Course, OrderLine, RestaurantId } from './menus'

export type WaiterClip =
  | 'idle'
  | 'greet'
  | 'wine'
  | 'champagne'
  | 'dessert'
  | 'chocolate'
  | 'carpaccio-oyster'
  | 'polenta'
  | 'mushroom'
  | 'medallion'
  | 'eggplant'
  | 'cauliflower'
  | 'palm'
  | 'carpaccio-beef'
  | 'foie'
  | 'filet'
  | 'ribeye'
  | 'tomahawk'
  | 'surf'
  | 'vegan'
  | 'steak'

/** Evening memory, earliest to latest. Visual idle is the locked dining-room look, not these clips. */
export const EVENING_STAGES: WaiterClip[] = [
  'idle',
  'greet',
  'wine',
  'vegan',
  'carpaccio-oyster',
  'polenta',
  'mushroom',
  'medallion',
  'eggplant',
  'cauliflower',
  'palm',
  'steak',
  'carpaccio-beef',
  'foie',
  'filet',
  'ribeye',
  'tomahawk',
  'surf',
  'champagne',
  'dessert',
  'chocolate',
]

export const WAITER_CLIPS: Record<
  WaiterClip,
  { src: string; label: string; presenceLabel: string }
> = {
  idle: {
    src: '/videos/restaurant-dining-room.mp4',
    label: 'In the dining room',
    presenceLabel: 'In the dining room',
  },
  greet: {
    src: '/videos/waiter-greet.mp4',
    label: 'Welcoming you at the table',
    presenceLabel: 'Welcome at the table',
  },
  wine: {
    src: '/videos/waiter-wine.mp4',
    label: 'Pouring wine',
    presenceLabel: 'Wine on the table',
  },
  champagne: {
    src: '/videos/waiter-champagne-pop.mp4',
    label: 'Popping champagne',
    presenceLabel: 'Champagne on the table',
  },
  dessert: {
    src: '/videos/waiter-dessert.mp4',
    label: 'Serving crème brûlée',
    presenceLabel: 'Dessert at the table',
  },
  chocolate: {
    src: '/videos/waiter-chocolate.mp4',
    label: 'Serving chocolate dessert',
    presenceLabel: 'Soufflé at the table',
  },
  'carpaccio-oyster': {
    src: '/videos/waiter-carpaccio-oyster.mp4',
    label: 'Serving king oyster carpaccio',
    presenceLabel: 'Carpaccio at the table',
  },
  polenta: {
    src: '/videos/waiter-polenta.mp4',
    label: 'Serving seared polenta',
    presenceLabel: 'Polenta at the table',
  },
  mushroom: {
    src: '/videos/waiter-mushroom-plate.mp4',
    label: 'Serving wild mushrooms',
    presenceLabel: 'Mushrooms at the table',
  },
  medallion: {
    src: '/videos/waiter-medallion.mp4',
    label: 'Serving oyster medallion',
    presenceLabel: 'Medallion at the table',
  },
  eggplant: {
    src: '/videos/waiter-eggplant.mp4',
    label: 'Serving grilled eggplant',
    presenceLabel: 'Eggplant at the table',
  },
  cauliflower: {
    src: '/videos/waiter-cauliflower.mp4',
    label: 'Serving roasted cauliflower',
    presenceLabel: 'Cauliflower at the table',
  },
  palm: {
    src: '/videos/waiter-palm.mp4',
    label: 'Serving mushroom medallion',
    presenceLabel: 'Medallion at the table',
  },
  'carpaccio-beef': {
    src: '/videos/waiter-carpaccio-beef.mp4',
    label: 'Serving beef carpaccio',
    presenceLabel: 'Carpaccio at the table',
  },
  foie: {
    src: '/videos/waiter-foie.mp4',
    label: 'Serving foie gras',
    presenceLabel: 'Foie gras at the table',
  },
  filet: {
    src: '/videos/waiter-filet.mp4',
    label: 'Serving filet mignon',
    presenceLabel: 'Filet at the table',
  },
  ribeye: {
    src: '/videos/waiter-ribeye.mp4',
    label: 'Serving ribeye',
    presenceLabel: 'Ribeye at the table',
  },
  tomahawk: {
    src: '/videos/waiter-tomahawk.mp4',
    label: 'Serving the tomahawk',
    presenceLabel: 'Tomahawk at the table',
  },
  surf: {
    src: '/videos/waiter-surf.mp4',
    label: 'Serving steak and lobster',
    presenceLabel: 'Surf and turf at the table',
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
}

/** Source clips are ~7–26s; hold service on that clip for this long (repeat/loop) before returning to the chosen room. */
export const MIN_SERVICE_MS = 24_000

/**
 * One clip per orderable item. Same dish name across kitchens may share a file.
 * Different dishes never share a file. See public/videos/CLIP-GAPS.txt.
 */
export const ITEM_CLIP: Record<string, WaiterClip> = {
  've-carpaccio': 'carpaccio-oyster',
  've-polenta': 'polenta',
  've-mushroom-app': 'mushroom',
  've-medallion': 'medallion',
  've-lentil': 'eggplant',
  've-cauliflower': 'cauliflower',
  've-palm': 'palm',
  've-souffle': 'chocolate',
  've-brulee': 'dessert',
  'ss-carpaccio': 'carpaccio-beef',
  'ss-foie': 'foie',
  'ss-mushroom-app': 'mushroom',
  'ss-filet': 'filet',
  'ss-ribeye': 'ribeye',
  'ss-tomahawk': 'tomahawk',
  'ss-surf': 'surf',
  'ss-souffle': 'chocolate',
  'ss-brulee': 'dessert',
}

const DRINK_OR_STAFF = new Set<WaiterClip>(['idle', 'greet', 'wine', 'champagne'])

export function isFoodClip(clip: WaiterClip): boolean {
  return !DRINK_OR_STAFF.has(clip)
}

export function stageIndex(clip: WaiterClip): number {
  return EVENING_STAGES.indexOf(clip)
}

export function laterStage(current: WaiterClip, incoming: WaiterClip): WaiterClip {
  const currentIndex = stageIndex(current)
  const incomingIndex = stageIndex(incoming)
  if (incomingIndex < 0) return isFoodClip(incoming) ? incoming : current
  if (currentIndex < 0) return incoming
  return incomingIndex > currentIndex ? incoming : current
}

/** Serving / arrival clip to play. Idle requests become a greet. Food and drinks always play the matching serve. */
export function clipToPlay(_presence: WaiterClip, requested: WaiterClip): WaiterClip {
  if (requested === 'idle') return 'greet'
  return requested
}

/** Evening memory after a serving beat. The dining-room backdrop returns separately. */
export function presenceAfterService(presence: WaiterClip, played: WaiterClip): WaiterClip {
  if (played === 'idle') return presence
  if (played === 'greet') return presence === 'idle' ? 'greet' : presence
  return laterStage(presence, played)
}

export function clipForOrder(line: {
  course: Course
  restaurantId: RestaurantId
  itemId: string
}): WaiterClip {
  const mapped = ITEM_CLIP[line.itemId]
  if (mapped) return mapped
  if (line.course === 'dessert') return 'dessert'
  if (line.restaurantId === 'verdant-ember') return 'vegan'
  return 'greet'
}

export function clipForTable(lines: Pick<OrderLine, 'course' | 'restaurantId' | 'itemId'>[]): WaiterClip {
  if (lines.length === 0) return 'greet'
  return clipForLatest(lines)
}

/**
 * This browser’s plate only. Partner dishes never belong here.
 * Personal orders win so Gregory’s ribeye is not replaced by a shared cauliflower.
 * Shared table dishes play only when this person has not ordered their own food.
 */
export function mineToServe(you: OrderLine[], table: OrderLine[]): OrderLine[] {
  if (you.length > 0) return you
  return table
}

export function clipForLatest(lines: Pick<OrderLine, 'course' | 'restaurantId' | 'itemId'>[]): WaiterClip {
  if (lines.length === 0) return 'greet'
  return clipForOrder(lines[lines.length - 1])
}

export function isMyServeSeat(seat: OrderLine['seat']): boolean {
  return seat === 'you' || seat === 'table'
}

export function clipForMenuCourse(course: Course): WaiterClip {
  return course === 'dessert' ? 'dessert' : 'vegan'
}
