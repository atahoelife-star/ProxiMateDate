import { useCallback, useState } from 'react'
import { RESTAURANT_ARRIVAL, type ArrivalBeat } from '../data/arrival'
import { shouldSkipArrival } from './arrivalGate'

export const RESTAURANT_LOOK_KEY = 'pd-restaurant-look'

export function lookThumb(beat: ArrivalBeat) {
  return beat.poster ?? beat.src
}

export function lookBackdrop(beat: ArrivalBeat): { src: string; kind: 'image' | 'video' } {
  if (beat.kind === 'video') return { src: beat.src, kind: 'video' }
  return { src: beat.src, kind: 'image' }
}

export function lookById(id: string | null): ArrivalBeat {
  return RESTAURANT_ARRIVAL.find((beat) => beat.id === id) ?? RESTAURANT_ARRIVAL[0]
}

export function readRestaurantLook(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = sessionStorage.getItem(RESTAURANT_LOOK_KEY)
    if (id && RESTAURANT_ARRIVAL.some((beat) => beat.id === id)) return id
  } catch {
    /* private mode */
  }
  return null
}

export function writeRestaurantLook(id: string) {
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
    writeRestaurantLook(id)
    setLookId(id)
    setPhase('lead')
  }, [])

  const finishLead = useCallback(() => setPhase('room'), [])

  return {
    phase,
    look: lookById(lookId),
    finishTour,
    pickLook,
    finishLead,
  }
}
