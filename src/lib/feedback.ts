export type FeedbackRating = 'loved' | 'ok' | 'confusing'
export type FeedbackRoom = 'free' | 'dinner' | 'movie' | 'site'
export type FeedbackSource = 'end-of-date' | 'footer'
export type FeedbackPlan = 'free' | 'dinner' | 'movie' | 'premium' | 'extend' | ''

export type FeedbackEntry = {
  id: string
  rating: FeedbackRating
  note: string
  room: FeedbackRoom
  plan: FeedbackPlan | string
  source: FeedbackSource | string
  at: number
}

export const FEEDBACK_RATINGS: { value: FeedbackRating; label: string }[] = [
  { value: 'loved', label: 'Loved it' },
  { value: 'ok', label: 'It was ok' },
  { value: 'confusing', label: 'Confusing' },
]

export const FEEDBACK_ROOMS: { value: FeedbackRoom; label: string }[] = [
  { value: 'free', label: 'Free Date Night' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'movie', label: 'Movie Night' },
  { value: 'site', label: 'Just the site' },
]

const PRODUCTION = 'https://www.proximatedate.com/api/feedback'

function endpoints() {
  if (typeof window === 'undefined') return ['/api/feedback']
  const origin = window.location.origin.replace(/\/$/, '')
  if (origin === 'https://proximatedate.com') return [PRODUCTION]
  return [`${origin}/api/feedback`]
}

export function feedbackPromptKey(room: FeedbackRoom, roomId: string, startedAt: number) {
  return `pd-feedback-seen:${room}:${roomId}:${startedAt}`
}

export function hasSeenFeedbackPrompt(room: FeedbackRoom, roomId: string, startedAt: number) {
  if (typeof window === 'undefined' || startedAt <= 0) return false
  try {
    return sessionStorage.getItem(feedbackPromptKey(room, roomId, startedAt)) === '1'
  } catch {
    return false
  }
}

export function markFeedbackPromptSeen(room: FeedbackRoom, roomId: string, startedAt: number) {
  if (typeof window === 'undefined' || startedAt <= 0) return
  try {
    sessionStorage.setItem(feedbackPromptKey(room, roomId, startedAt), '1')
  } catch {
    /* still allow dismiss */
  }
}

export function roomLabel(room: string) {
  return FEEDBACK_ROOMS.find((item) => item.value === room)?.label || room
}

export function ratingLabel(rating: string) {
  return FEEDBACK_RATINGS.find((item) => item.value === rating)?.label || rating
}

export async function submitFeedback(input: {
  rating: FeedbackRating
  note?: string
  room: FeedbackRoom
  plan?: FeedbackPlan | string
  source: FeedbackSource
}): Promise<boolean> {
  const payload = JSON.stringify({
    rating: input.rating,
    note: (input.note || '').trim().slice(0, 800),
    room: input.room,
    plan: input.plan || '',
    source: input.source,
  })
  for (const url of endpoints()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      if (response.ok) return true
    } catch {
      continue
    }
  }
  return false
}
