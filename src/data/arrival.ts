export type ArrivalBeat = {
  id: string
  src: string
  kind: 'image' | 'video'
  poster?: string
  durationMs: number
}

export const RESTAURANT_ARRIVAL: ArrivalBeat[] = [
  {
    id: 'doors',
    src: '/videos/restaurant-walk-in.mp4',
    kind: 'video',
    poster: '/images/arrival/restaurant/walk-in.jpg',
    durationMs: 3400,
  },
  {
    id: 'host',
    src: '/images/arrival/restaurant/host-stand.jpg',
    kind: 'image',
    durationMs: 2600,
  },
  {
    id: 'tables',
    src: '/images/arrival/restaurant/dining-room.jpg',
    kind: 'image',
    durationMs: 2600,
  },
  {
    id: 'yours',
    src: '/images/arrival/restaurant/your-table.jpg',
    kind: 'image',
    durationMs: 2600,
  },
  {
    id: 'sit',
    src: '/images/arrival/restaurant/sit-down.jpg',
    kind: 'image',
    durationMs: 2800,
  },
]

export const CINEMA_ARRIVAL: ArrivalBeat[] = [
  {
    id: 'tickets',
    src: '/images/arrival/cinema/ticket-booth.jpg',
    kind: 'image',
    durationMs: 2600,
  },
  {
    id: 'lobby',
    src: '/images/arrival/cinema/lobby.jpg',
    kind: 'image',
    durationMs: 2600,
  },
  {
    id: 'popcorn',
    src: '/videos/cinema-popcorn-machine.mp4',
    kind: 'video',
    poster: '/images/arrival/cinema/popcorn.jpg',
    durationMs: 6200,
  },
  {
    id: 'seats',
    src: '/images/arrival/cinema/theater.jpg',
    kind: 'image',
    durationMs: 2800,
  },
]
