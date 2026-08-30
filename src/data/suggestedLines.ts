import { isFoodClip, type WaiterClip } from './waiterClips'

export type ChatMoment = 'settling' | 'waiter' | 'food' | 'movie' | 'quiet'

const TOAST_CLIPS: WaiterClip[] = ['wine', 'champagne']

export function chatMomentForEvening(opts: {
  watching: boolean
  waiterClip: WaiterClip
  myMessageCount: number
}): ChatMoment {
  if (opts.watching) return 'movie'
  if (isFoodClip(opts.waiterClip)) return 'food'
  if (TOAST_CLIPS.includes(opts.waiterClip)) return 'waiter'
  if (opts.myMessageCount >= 3) return 'quiet'
  return 'settling'
}

const LINES: Record<ChatMoment, string[]> = {
  settling: [
    'This is nice.',
    'Cheers — glad we did this.',
    'The room looks good from here.',
    'How’s your evening going so far?',
  ],
  waiter: [
    'Cheers.',
    'This is a good pour.',
    'Shall we toast?',
    'This is nice.',
  ],
  food: [
    'That looks really good.',
    'How’s yours looking?',
    'Good choice.',
    'Want to start together?',
  ],
  movie: [
    'Want to pause for a second?',
    'This scene.',
    'You ok if I talk through this?',
    'Are you following this?',
  ],
  quiet: [
    'You still there?',
    'How are you doing?',
    'This is nice.',
    'Want to keep going, or take a minute?',
  ],
}

export function linesForMoment(moment: ChatMoment): string[] {
  return LINES[moment]
}
