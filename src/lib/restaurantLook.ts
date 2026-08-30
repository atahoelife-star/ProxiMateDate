import { useCallback, useState } from 'react'
import { RESTAURANT_ARRIVAL, type ArrivalBeat } from '../data/arrival'
import { shouldSkipArrival } from './arrivalGate'

export const RESTAURANT_LOOK_KEY = 'pd-restaurant-look'

/** Seated rooms only — never the walk-in / service-door clip. */
export const RESTAURANT_LOOKS: ArrivalBeat[] = RESTAURANT_ARRIVAL.filter((beat) => beat.id !== 'doors')

const DEFAULT_LOOK = RESTAURANT_LOOKS.find((beat) => beat.id === 'tables') ?? RESTAURANT_LOOKS[0]

export function lookThumb(beat: ArrivalBeat) {
  return beat.poster ?? beat.src
}

export function lookBackdrop(beat: ArrivalBeat): { src: string; kind: 'image' | 'video' } {
  // Walk-in / waiter-door video is arrival only. Seated looks are stills of the room.
  if (beat.id === 'doors' || beat.src.includes('restaurant-walk-in') || beat.src.includes('waiter-idle')) {
    return { src: lookThumb(DEFAULT_LOOK), kind: 'image' }
  }
  if (beat.kind === 'video') return { src: beat.src, kind: 'video' }
  return { src: beat.src, kind: 'image' }
}

export function lookById(id: string | null): ArrivalBeat {
  if (id && id !== 'doors') {
    const found = RESTAURANT_LOOKS.find((beat) => beat.id === id)
    if (found) return found
  }
  return DEFAULT_LOOK
}

export function readRestaurantLook(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = sessionStorage.getItem(RESTAURANT_LOOK_KEY)
    if (id && RESTAURANT_LOOKS.some((beat) => beat.id === id)) return id
  } catch {
    /* private mode */
  }
  return null
}

export function writeRestaurantLook(id: string) {
  if (id === 'doors') return
  try {
    sessionStorage.setItem(RESTAURANT_LOOK_KEY, id)
  } catch {
    /* private mode */
  }
}

export type RestaurantEntryPhase = 'tour' | 'choose' | 'lead' | 'room'

export function useRestaurantEntry() {
  const [phase, setPhase] = useState<RestaurantEntryPhase>(() => {
    if (typeof window === 'undefined') return 'tour'
    const params = new URLSearchParams(window.location.search)
    if (params.get('arrive') === '1') return 'tour'
    if (readRestaurantLook()) return 'room'
    if (params.get('follow') === '1') return 'room'
    if (shouldSkipArrival('pd-arrival-restaurant')) return 'choose'
    return 'tour'
  })
  const [lookId, setLookId] = useState<string | null>(() => readRestaurantLook())

  const finishTour = useCallback(() => setPhase('choose'), [])

  const pickLook = useCallback((id: string) => {
    if (id === 'doors') return
    writeRestaurantLook(id)
    setLookId(id)
    setPhase('lead')
  }, [])

  const finishLead = useCallback(() => setPhase('room'), [])

  /** Back to the thumbnail picker. Tour stays marked done; current look stays until they pick another. */
  const changeRoom = useCallback(() => setPhase('choose'), [])

  const stayHere = useCallback(() => setPhase('room'), [])

  return {
    phase,
    look: lookById(lookId),
    lookId,
    finishTour,
    pickLook,
    finishLead,
    changeRoom,
    stayHere,
  }
}
