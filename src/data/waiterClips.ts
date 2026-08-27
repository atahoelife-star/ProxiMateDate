export type WaiterClip = 'idle' | 'greet' | 'wine' | 'champagne' | 'plate' | 'dessert'

export const WAITER_CLIPS: Record<WaiterClip, { src: string; loop: boolean; label: string }> = {
  idle: { src: '/videos/waiter-idle.mp4', loop: true, label: 'At your table' },
  greet: { src: '/videos/waiter-idle.mp4', loop: false, label: 'Arriving' },
  wine: { src: '/videos/waiter-pour-wine.mp4', loop: false, label: 'Pouring wine' },
  champagne: { src: '/videos/waiter-pour-champagne.mp4', loop: false, label: 'Pouring champagne' },
  plate: { src: '/videos/waiter-set-plate.mp4', loop: false, label: 'Setting a plate' },
  dessert: { src: '/videos/waiter-dessert.mp4', loop: false, label: 'Serving dessert' },
}

export function clipForMenuCourse(course: 'appetizer' | 'entree' | 'dessert'): WaiterClip {
  return course === 'dessert' ? 'dessert' : 'plate'
}
