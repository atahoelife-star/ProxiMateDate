/** Hold maps to power. Miss unless release is in a tight, learnable window. */

export type SweetSpot = {
  center: number
  half: number
}

export const THROW_SWEET: SweetSpot = { center: 0.7, half: 0.055 }
export const BELL_SWEET: SweetSpot = { center: 0.84, half: 0.05 }

export function powerFromHold(ms: number) {
  const raw = ms / 1050
  if (raw <= 1) return Math.min(1, Math.max(0.04, raw))
  return Math.max(0.12, 1 - (raw - 1) * 1.15)
}

export function inSweet(power: number, sweet: SweetSpot = THROW_SWEET) {
  return Math.abs(power - sweet.center) <= sweet.half
}

/** Center of the band is reliable; edges can still miss. Outside the band always misses. */
export function skillHit(power: number, sweet: SweetSpot = THROW_SWEET, roll: () => number = Math.random) {
  const delta = Math.abs(power - sweet.center)
  if (delta > sweet.half) return false
  const closeness = 1 - delta / sweet.half
  const chance = 0.52 + closeness * 0.4
  return roll() < chance
}

export function sweetLeft(sweet: SweetSpot) {
  return Math.max(0, sweet.center - sweet.half)
}

export function sweetRight(sweet: SweetSpot) {
  return Math.min(1, sweet.center + sweet.half)
}
