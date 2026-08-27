export type WaiterClip = 'idle' | 'greet' | 'wine' | 'plate' | 'champagne' | 'dessert'

/** Evening atmosphere, earliest to latest. Greet shares the idle file (no waiter-greet.mp4 on disk). */
export const EVENING_STAGES: WaiterClip[] = ['idle', 'greet', 'wine', 'plate', 'champagne', 'dessert']

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
  plate: {
    src: '/videos/waiter-set-plate.mp4',
    label: 'Setting a plate',
    presenceLabel: 'Courses on the table',
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

/** Source clips are ~7–14s; hold service on that clip for this long (repeat/loop) before settling. */
export const MIN_SERVICE_MS = 24_000

export function stageIndex(clip: WaiterClip): number {
  return EVENING_STAGES.indexOf(clip)
}

export function laterStage(current: WaiterClip, incoming: WaiterClip): WaiterClip {
  return stageIndex(incoming) > stageIndex(current) ? incoming : current
}

/**
 * Video to play for a call/order. Never visually rewind (Call Waiter after wine
 * must not snap back to the first idle/greet loop).
 */
export function clipToPlay(presence: WaiterClip, requested: WaiterClip): WaiterClip {
  if (requested === 'idle' || requested === 'greet') {
    return presence === 'idle' ? 'greet' : presence
  }
  return stageIndex(requested) < stageIndex(presence) ? presence : requested
}

/** After a serving beat, stay on the later of the current evening and what just played. */
export function presenceAfterService(presence: WaiterClip, played: WaiterClip): WaiterClip {
  const incoming = played === 'idle' ? 'greet' : played
  return laterStage(presence, incoming)
}

export function clipForMenuCourse(course: 'appetizer' | 'entree' | 'dessert'): WaiterClip {
  return course === 'dessert' ? 'dessert' : 'plate'
}
