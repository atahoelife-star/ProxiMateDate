export const PARK_NAME = 'Pinewick Fair'
export const PARK_SLUG = '/carnival'
export const PARK_TAGLINE = 'Lanterns, timber, and a warm country midway'

export const CARNIVAL_SESSION_MS = 2 * 60 * 60 * 1000
export const CARNIVAL_BUDGET_LABEL = '2 hours'

export type RideId = 'coaster' | 'flume' | 'hollow' | 'wheel' | 'carousel'
export type AttractionId = RideId | 'games'
export type GameId = 'ringtoss' | 'strongman' | 'bottles' | 'balloons'

export type HollowBeat = {
  id: string
  src: string
  durationMs: number
  title: string
  line: string
}

export type RideAttraction = {
  id: RideId
  name: string
  kicker: string
  blurb: string
  still: string
  durationMs: number
  chatLine: string
}

export type GameBooth = {
  id: GameId
  name: string
  blurb: string
  still: string
  play: string
}

export const RIDES: RideAttraction[] = [
  {
    id: 'coaster',
    name: 'The Ridge Runner',
    kicker: 'Wooden coaster',
    blurb: 'A timber out-and-back along the pine ridge. Warm bulbs on the lift, no branded park IP — just painted pine and a long first drop.',
    still: '/images/carnival/carnival-coaster.jpg',
    durationMs: 11000,
    chatLine: 'You both climb The Ridge Runner. The lift clicks through the pines.',
  },
  {
    id: 'flume',
    name: 'Willow Run Flume',
    kicker: 'Log ride',
    blurb: 'A creek flume under the willows. Slow water, then a splash into the lower pond. Wet sleeves optional.',
    still: '/images/carnival/carnival-flume.jpg',
    durationMs: 10000,
    chatLine: 'Willow Run Flume pushes off. Creek water, then the drop.',
  },
  {
    id: 'hollow',
    name: 'Firefly Hollow',
    kicker: 'Animatronic dark ride',
    blurb: 'Bears in homemade country clothes, rocking chairs on cabin porches, mason-jar lanterns, and fireflies. Homey woodland storytelling — not a pirate boat.',
    still: '/images/carnival/carnival-hollow-porch.jpg',
    durationMs: 16000,
    chatLine: 'Firefly Hollow starts. Cabin bears, lanterns, and a slow creek — no pirates.',
  },
  {
    id: 'wheel',
    name: 'The Lantern Wheel',
    kicker: 'Ferris wheel',
    blurb: 'A cream-and-gold wheel with Edison bulbs. The top gondola looks over the pines and the glowing midway.',
    still: '/images/carnival/carnival-wheel.jpg',
    durationMs: 12000,
    chatLine: 'The Lantern Wheel lifts you over the midway. Night lights, quiet talk.',
  },
  {
    id: 'carousel',
    name: 'The Gilded Round',
    kicker: 'Carousel',
    blurb: 'Hand-carved horses, a fox, and a stag under warm canopy bulbs. Original animals — not a famous-park clone.',
    still: '/images/carnival/carnival-carousel.jpg',
    durationMs: 10000,
    chatLine: 'The Gilded Round turns. Warm bulbs, carved horses and a fox.',
  },
]

export const HOLLOW_BEATS: HollowBeat[] = [
  {
    id: 'porch',
    src: '/images/carnival/carnival-hollow-porch.jpg',
    durationMs: 5500,
    title: 'Porch light',
    line: 'Two bears in country clothes rock on a cabin porch. Mason jars glow. Fireflies lift off the grass.',
  },
  {
    id: 'lane',
    src: '/images/carnival/carnival-hollow-lane.jpg',
    durationMs: 6000,
    title: 'Woodland lane',
    line: 'The boat slips a shallow creek. Lanterns hang in the oaks. Another cabin, another neighbor waving from a stump.',
  },
  {
    id: 'return',
    src: '/images/carnival/carnival-hollow-porch.jpg',
    durationMs: 5000,
    title: 'Home stretch',
    line: 'Back past the porch. A bear tips a hat. The fireflies stay with you to the unload.',
  },
]

export const GAMES: GameBooth[] = [
  {
    id: 'ringtoss',
    name: 'Ring toss',
    blurb: 'Three rings, a row of bottles, cream-and-burgundy canvas.',
    still: '/images/carnival/carnival-ringtoss.jpg',
    play: 'Click a bottle to toss a ring.',
  },
  {
    id: 'strongman',
    name: 'Ring the bell',
    blurb: 'High striker. Time the mallet when the bar is high.',
    still: '/images/carnival/carnival-strongman.jpg',
    play: 'Watch the power bar, then strike.',
  },
  {
    id: 'bottles',
    name: 'Bottle knock-down',
    blurb: 'Milk-bottle pyramids and three softballs.',
    still: '/images/carnival/carnival-bottles.jpg',
    play: 'Click a stack to throw.',
  },
  {
    id: 'balloons',
    name: 'Balloon darts',
    blurb: 'Pastel balloons, five darts, ordinary stuffed prizes.',
    still: '/images/carnival/carnival-balloons.jpg',
    play: 'Click a balloon to throw a dart.',
  },
]

export const GAMES_STILL = '/images/carnival/carnival-midway.jpg'
export const GATES_STILL = '/images/carnival/carnival-gates.jpg'
export const PLAZA_STILL = '/images/carnival/carnival-plaza.jpg'
export const MIDWAY_STILL = '/images/carnival/carnival-midway.jpg'

export function rideById(id: RideId) {
  return RIDES.find((ride) => ride.id === id)
}

export function gameById(id: GameId) {
  return GAMES.find((game) => game.id === id)
}
