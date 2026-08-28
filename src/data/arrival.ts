export type ArrivalBeat = {
  id: string
  src: string
  kind: 'image' | 'video'
  caption: string
  durationMs: number
}

export const RESTAURANT_ARRIVAL: ArrivalBeat[] = [
  {
    id: 'doors',
    src: '/videos/restaurant-walk-in.mp4',
    kind: 'video',
    caption: 'The doors open',
    durationMs: 3400,
  },
  {
    id: 'host',
    src: '/images/arrival/restaurant/host-stand.jpg',
    kind: 'image',
    caption: 'Past the host',
    durationMs: 2600,
  },
  {
    id: 'tables',
    src: '/images/arrival/restaurant/dining-room.jpg',
    kind: 'image',
    caption: 'Past the tables',
    durationMs: 2600,
  },
  {
    id: 'yours',
    src: '/images/arrival/restaurant/your-table.jpg',
    kind: 'image',
    caption: 'Your table for two',
    durationMs: 2600,
  },
  {
    id: 'sit',
    src: '/images/arrival/restaurant/sit-down.jpg',
    kind: 'image',
    caption: 'Have a seat',
    durationMs: 2800,
  },
]

export const CINEMA_ARRIVAL: ArrivalBeat[] = [
  {
    id: 'tickets',
    src: '/images/arrival/cinema/ticket-booth.jpg',
    kind: 'image',
    caption: 'Tickets, please',
    durationMs: 2600,
  },
  {
    id: 'lobby',
    src: '/images/arrival/cinema/lobby.jpg',
    kind: 'image',
    caption: 'Into the lobby',
    durationMs: 2600,
  },
  {
    id: 'popcorn',
    src: '/images/arrival/cinema/popcorn.jpg',
    kind: 'image',
    caption: 'Grab the popcorn',
    durationMs: 2600,
  },
  {
    id: 'seats',
    src: '/images/arrival/cinema/theater.jpg',
    kind: 'image',
    caption: 'Find your seats',
    durationMs: 2800,
  },
]
