import type { Course, OrderLine, RestaurantId } from './menus'

export type WaiterClip = 'idle' | 'greet' | 'wine' | 'vegan' | 'steak' | 'champagne' | 'dessert' | 'chocolate'

/** Evening memory, earliest to latest. Visual idle is the locked dining-room look, not these clips. */
export const EVENING_STAGES: WaiterClip[] = ['idle', 'greet', 'wine', 'vegan', 'steak', 'champagne', 'dessert', 'chocolate']

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
    src: '/videos/waiter-idle.mp4',
    label: 'Coming to the table',
    presenceLabel: 'Ready for your order',
  },
  wine: {
    // Faceless pour from the house set. waiter-pour-wine.mp4 is a different
    // sommelier in another room — kept on disk, not shown (cast).
    src: '/videos/waiter-pour-champagne.mp4',
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
    label: 'Serving crème brûlée',
    presenceLabel: 'Dessert at the table',
  },
  chocolate: {
    src: '/videos/waiter-chocolate.mp4',
    label: 'Serving chocolate dessert',
    presenceLabel: 'Soufflé at the table',
  },
}

/** Source clips are ~7–14s; hold service on that clip for this long (repeat/loop) before returning to the chosen room. */
export const MIN_SERVICE_MS = 24_000

/** One clip per orderable item. Gaps that would show the wrong plate use greet instead — see public/videos/CLIP-GAPS.txt. */
export const ITEM_CLIP: Record<string, WaiterClip> = {
  've-carpaccio': 'vegan',
  've-polenta': 'vegan',
  've-mushroom-app': 'vegan',
  've-medallion': 'vegan',
  've-lentil': 'vegan',
  've-cauliflower': 'vegan',
  've-palm': 'vegan',
  've-souffle': 'chocolate',
  've-brulee': 'dessert',
  'ss-carpaccio': 'greet',
  'ss-foie': 'greet',
  'ss-mushroom-app': 'vegan',
  'ss-filet': 'steak',
  'ss-ribeye': 'steak',
  'ss-tomahawk': 'steak',
  'ss-surf': 'steak',
  'ss-souffle': 'chocolate',
  'ss-brulee': 'dessert',
}

const FOOD_CLIP_SET = new Set<WaiterClip>(['vegan', 'steak', 'dessert', 'chocolate'])

export function isFoodClip(clip: WaiterClip): boolean {
  return FOOD_CLIP_SET.has(clip)
}

export function stageIndex(clip: WaiterClip): number {
  return EVENING_STAGES.indexOf(clip)
}

export function laterStage(current: WaiterClip, incoming: WaiterClip): WaiterClip {
  return stageIndex(incoming) > stageIndex(current) ? incoming : current
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
  const clips = lines.map(clipForOrder)
  if (clips.includes('chocolate')) return 'chocolate'
  if (clips.includes('dessert')) return 'dessert'
  if (clips.includes('steak')) return 'steak'
  if (clips.includes('vegan')) return 'vegan'
  return clips[0] ?? 'greet'
}

/** This browser’s plate only — partner dishes play on their screen. */
export function mineToServe(you: OrderLine[], table: OrderLine[]): OrderLine[] {
  return [...you, ...table]
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
