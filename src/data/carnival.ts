export const PARK_NAME = 'Pinewick Fair'
export const PARK_SLUG = '/carnival'
export const PARK_TAGLINE = 'Lanterns, timber, and a warm country midway'

export const CARNIVAL_SESSION_MS = 2 * 60 * 60 * 1000
export const CARNIVAL_BUDGET_LABEL = '2 hours'

export type RideId = 'coaster' | 'flume' | 'hollow' | 'wheel' | 'carousel'
export type AttractionId = RideId | 'games'
export type GameId = 'ringtoss' | 'strongman' | 'bottles' | 'balloons'
export type RideMotion = 'in' | 'left' | 'right' | 'up' | 'drop' | 'zoom' | 'drift'
export type RideFlavor = 'coaster' | 'flume' | 'hollow' | 'wheel' | 'carousel'

export type RideBeat = {
  id: string
  src: string
  durationMs: number
  title: string
  line: string
  motion: RideMotion
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

export type RideShow = {
  id: RideId
  flavor: RideFlavor
  film: string
  queue: RideBeat
  queueChat: string
  rideChat: string
  beats: RideBeat[]
  loop: boolean
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
    blurb: 'Queue the lift, then a generated on-train ride-through: rails, timber, and pines streaming past.',
    still: '/images/carnival/carnival-coaster.jpg',
    durationMs: 82000,
    chatLine: 'You join the Ridge Runner line. Timber, bulbs, and the lift ahead.',
  },
  {
    id: 'flume',
    name: 'Willow Run Flume',
    kicker: 'Log ride',
    blurb: 'Wait on the dock, then a full ride-through: willows, logging camp, lift, tunnel, splash, home.',
    still: '/images/carnival/carnival-flume.jpg',
    durationMs: 162000,
    chatLine: 'Willow Run Flume — the dock line, then a log on the creek.',
  },
  {
    id: 'hollow',
    name: 'Firefly Hollow',
    kicker: 'Animatronic dark ride',
    blurb: 'A full boat journey: cabin bears, raccoon den, wolves’ lair, then a field of fireflies. Not pirates.',
    still: '/images/carnival/carnival-hollow-porch.jpg',
    durationMs: 210000,
    chatLine: 'Firefly Hollow — the boathouse line. Cabin bears and a slow creek. No pirates.',
  },
  {
    id: 'wheel',
    name: 'The Lantern Wheel',
    kicker: 'Ferris wheel',
    blurb: 'A full gondola orbit: up through the bulbs, the top lights, then down over handlers and queues.',
    still: '/images/carnival/carnival-wheel.jpg',
    durationMs: 216000,
    chatLine: 'The Lantern Wheel is turning. Handlers load the gondola.',
  },
  {
    id: 'carousel',
    name: 'The Gilded Round',
    kicker: 'Carousel',
    blurb: 'A full turn: horses, a fox, and a stag spin and bob under the bulbs the whole time.',
    still: '/images/carnival/carnival-carousel.jpg',
    durationMs: 206000,
    chatLine: 'The Gilded Round is already turning. Horses rise and fall.',
  },
]

export const RIDE_SHOWS: RideShow[] = [
  {
    id: 'coaster',
    flavor: 'coaster',
    film: '/videos/carnival/coaster.mp4',
    loop: false,
    queueChat: 'You wait on the timber ramp. The train sits in the station.',
    rideChat: 'The train rolls. Chain, lift, hang, drop, a bank, the tunnel, then home.',
    queue: {
      id: 'queue',
      src: '/images/carnival/carnival-coaster-queue.jpg',
      durationMs: 6500,
      title: 'Station line',
      line: 'Switchback ramp, warm bulbs, a ride op at the podium. The wooden train waits.',
      motion: 'in',
    },
    beats: [
      {
        id: 'lift',
        src: '/images/carnival/carnival-coaster-lift.jpg',
        durationMs: 36000,
        title: 'Lift hill',
        line: 'Chain under the car. Pines climb past the lift lights.',
        motion: 'up',
      },
      {
        id: 'drop',
        src: '/images/carnival/carnival-coaster-drop.jpg',
        durationMs: 10000,
        title: 'First drop',
        line: 'The crest, then the timber falls away.',
        motion: 'drop',
      },
      {
        id: 'turn',
        src: '/images/carnival/carnival-coaster-turn.jpg',
        durationMs: 14000,
        title: 'Banked turn',
        line: 'The train leans through the pines.',
        motion: 'left',
      },
      {
        id: 'tunnel',
        src: '/images/carnival/carnival-coaster-tunnel.jpg',
        durationMs: 11000,
        title: 'Covered run',
        line: 'Beams rush the camera. Light at the far end.',
        motion: 'zoom',
      },
      {
        id: 'home',
        src: '/images/carnival/carnival-coaster-home.jpg',
        durationMs: 11000,
        title: 'Brake run',
        line: 'Lanterns in the station. The train comes home.',
        motion: 'in',
      },
    ],
  },
  {
    id: 'flume',
    flavor: 'flume',
    film: '/videos/carnival/flume.mp4',
    loop: false,
    queueChat: 'You wait on the Willow Run dock. Logs sit in the channel.',
    rideChat: 'The log pushes off. Willows, logging camp, lift, tunnel, splash, then the dock.',
    queue: {
      id: 'queue',
      src: '/images/carnival/carnival-flume-queue.jpg',
      durationMs: 6200,
      title: 'Dock line',
      line: 'Handlers, hollowed logs, willow water. Your boat is next.',
      motion: 'in',
    },
    beats: [
      {
        id: 'log',
        src: '/images/carnival/carnival-flume-log.jpg',
        durationMs: 4800,
        title: 'In the log',
        line: 'You sit in the trough. The channel pulls you forward.',
        motion: 'drift',
      },
      {
        id: 'miners',
        src: '/images/carnival/carnival-flume-miners.jpg',
        durationMs: 5000,
        title: 'Camp pocket',
        line: 'Loggers and a lantern miner work a timber camp beside the flume.',
        motion: 'right',
      },
      {
        id: 'tunnel',
        src: '/images/carnival/carnival-flume-tunnel.jpg',
        durationMs: 4200,
        title: 'Flume tunnel',
        line: 'The portal takes the log. Water talks on the walls.',
        motion: 'zoom',
      },
      {
        id: 'splash',
        src: '/images/carnival/carnival-flume-splash.jpg',
        durationMs: 3800,
        title: 'The drop',
        line: 'The log tips. Spray fills the pond.',
        motion: 'drop',
      },
    ],
  },
  {
    id: 'hollow',
    flavor: 'hollow',
    film: '/videos/carnival/hollow.mp4',
    loop: false,
    queueChat: 'Firefly Hollow queue — lanterns on the boathouse dock. No pirates.',
    rideChat: 'The boat slips the backwater: cabin bears, a raccoon den, wolves, then a field of fireflies.',
    queue: {
      id: 'queue',
      src: '/images/carnival/carnival-hollow-queue.jpg',
      durationMs: 6200,
      title: 'Boathouse line',
      line: 'Backwater dock, fireflies, a handler in plaid. Slow boats at the load.',
      motion: 'in',
    },
    beats: [
      {
        id: 'porch',
        src: '/images/carnival/carnival-hollow-porch.jpg',
        durationMs: 5200,
        title: 'Bear cabin',
        line: 'Bears in country clothes rock on the porch. Mason jars. Fireflies.',
        motion: 'in',
      },
      {
        id: 'creek',
        src: '/images/carnival/carnival-hollow-creek.jpg',
        durationMs: 5000,
        title: 'Backwater',
        line: 'Wide southern creek. Cypress, lanterns, cabin lights far ahead.',
        motion: 'drift',
      },
      {
        id: 'raccoon',
        src: '/images/carnival/carnival-hollow-raccoon.jpg',
        durationMs: 4800,
        title: 'Raccoon den',
        line: 'Raccoons in homemade clothes at a hollow-log den, washing in a tin basin.',
        motion: 'right',
      },
      {
        id: 'wolves',
        src: '/images/carnival/carnival-hollow-wolves.jpg',
        durationMs: 4800,
        title: 'Wolves’ lair',
        line: 'Wolves in flannel by a stone den and a small fire. Gentle, not a scare house.',
        motion: 'left',
      },
      {
        id: 'lane',
        src: '/images/carnival/carnival-hollow-lane.jpg',
        durationMs: 4200,
        title: 'Home stretch',
        line: 'Another cabin. A neighbor on a stump. The fireflies stay with the boat.',
        motion: 'zoom',
      },
    ],
  },
  {
    id: 'wheel',
    flavor: 'wheel',
    film: '/videos/carnival/wheel.mp4',
    loop: true,
    queueChat: 'Lantern Wheel line — handlers, ropes, the wheel already turning.',
    rideChat: 'The gondola lifts. Top lights, around the pines, then down over handlers and queues.',
    queue: {
      id: 'queue',
      src: '/images/carnival/carnival-wheel-queue.jpg',
      durationMs: 6000,
      title: 'Wheel line',
      line: 'Rope line at the base. Handlers load a gondola. The wheel is moving.',
      motion: 'in',
    },
    beats: [
      {
        id: 'rise',
        src: '/images/carnival/carnival-wheel.jpg',
        durationMs: 4500,
        title: 'Rising',
        line: 'Edison bulbs climb past the gondola. The pines drop away.',
        motion: 'up',
      },
      {
        id: 'top',
        src: '/images/carnival/carnival-wheel-top.jpg',
        durationMs: 5000,
        title: 'The top',
        line: 'The fair is a bowl of lights. Hold the rail.',
        motion: 'drift',
      },
      {
        id: 'descent',
        src: '/images/carnival/carnival-wheel-descent.jpg',
        durationMs: 4500,
        title: 'Descent',
        line: 'Midway booths and queue lines come up to meet you.',
        motion: 'drop',
      },
      {
        id: 'ground',
        src: '/images/carnival/carnival-wheel-ground.jpg',
        durationMs: 4200,
        title: 'Near the ground',
        line: 'Handlers, the next line, sawdust. Then you go around again.',
        motion: 'in',
      },
    ],
  },
  {
    id: 'carousel',
    flavor: 'carousel',
    film: '/videos/carnival/carousel.mp4',
    loop: true,
    queueChat: 'Gilded Round line — the horses are already rising and falling.',
    rideChat: 'You are on a horse. The round turns and the mounts bob the whole time.',
    queue: {
      id: 'queue',
      src: '/images/carnival/carnival-carousel-queue.jpg',
      durationMs: 5500,
      title: 'Carousel line',
      line: 'A short rope, a handler, the canopy already turning.',
      motion: 'in',
    },
    beats: [
      {
        id: 'ride',
        src: '/images/carnival/carnival-carousel-ride.jpg',
        durationMs: 8000,
        title: 'On the horse',
        line: 'Brass pole, carved horse, fox and stag in the mirrors.',
        motion: 'left',
      },
      {
        id: 'round',
        src: '/images/carnival/carnival-carousel.jpg',
        durationMs: 8000,
        title: 'The round',
        line: 'Warm bulbs streak. The platform keeps turning.',
        motion: 'drift',
      },
    ],
  },
]

export const GAMES: GameBooth[] = [
  {
    id: 'ringtoss',
    name: 'Ring toss',
    blurb: 'Watch the ring fly. It lands on the neck or it doesn’t.',
    still: '/images/carnival/carnival-ringtoss.jpg',
    play: 'Hold to cock. Release to throw.',
  },
  {
    id: 'strongman',
    name: 'Ring the bell',
    blurb: 'Mallet swings. The puck climbs the tower.',
    still: '/images/carnival/carnival-strongman.jpg',
    play: 'Hold to charge. Release to swing.',
  },
  {
    id: 'bottles',
    name: 'Bottle knock-down',
    blurb: 'The ball flies. Bottles tip.',
    still: '/images/carnival/carnival-bottles.jpg',
    play: 'Hold to cock. Release the ball.',
  },
  {
    id: 'balloons',
    name: 'Balloon darts',
    blurb: 'The dart flies. Balloons pop or the dart slips past.',
    still: '/images/carnival/carnival-balloons.jpg',
    play: 'Hold Space to cock. Release to throw. 3 of 5 wins a prize.',
  },
]

export const GAMES_STILL = '/images/carnival/carnival-midway.jpg'
export const GATES_STILL = '/images/carnival/carnival-gates.jpg'
export const PLAZA_STILL = '/images/carnival/carnival-plaza.jpg'
export const MIDWAY_STILL = '/images/carnival/carnival-midway.jpg'
export const PRIZE_STILL = '/images/carnival/carnival-prize-plush.jpg'

export function rideById(id: RideId) {
  return RIDES.find((ride) => ride.id === id)
}

export function showById(id: RideId) {
  return RIDE_SHOWS.find((show) => show.id === id)
}

export function gameById(id: GameId) {
  return GAMES.find((game) => game.id === id)
}
