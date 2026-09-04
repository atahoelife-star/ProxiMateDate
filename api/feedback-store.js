import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const FILE = '/tmp/pd-feedback.json'
const MAX = 200
const RATINGS = new Set(['loved', 'ok', 'confusing'])
const ROOMS = new Set(['free', 'dinner', 'movie', 'site'])
const SOURCES = new Set(['end-of-date', 'footer'])
const PLANS = new Set(['free', 'dinner', 'movie', 'premium', 'extend'])
const NOTE_MAX = 800

const memory = globalThis.__pdFeedback || (globalThis.__pdFeedback = { items: [] })

function load() {
  if (globalThis.__pdFeedbackLoaded) return memory
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
    if (parsed && Array.isArray(parsed.items)) {
      memory.items = parsed.items.filter((item) => item && typeof item === 'object')
    }
  } catch {
    /* first run or ephemeral disk */
  }
  globalThis.__pdFeedbackLoaded = true
  return memory
}

function persist(state) {
  try {
    mkdirSync('/tmp', { recursive: true })
    writeFileSync(FILE, JSON.stringify({ items: state.items }))
  } catch {
    /* same durability as room starts */
  }
}

export function isFeedbackRating(raw) {
  return RATINGS.has(String(raw || ''))
}

export function isFeedbackRoom(raw) {
  return ROOMS.has(String(raw || ''))
}

export function normalizeFeedback(body) {
  const rating = String(body?.rating || '')
  if (!isFeedbackRating(rating)) return { ok: false, error: 'bad_rating' }

  const room = String(body?.room || 'site')
  if (!isFeedbackRoom(room)) return { ok: false, error: 'bad_room' }

  const sourceRaw = String(body?.source || 'footer')
  const source = SOURCES.has(sourceRaw) ? sourceRaw : 'footer'

  const note = String(body?.note || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, NOTE_MAX)

  const planRaw = String(body?.plan || '').trim()
  const plan = PLANS.has(planRaw) ? planRaw : ''

  return {
    ok: true,
    entry: {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rating,
      note,
      room,
      plan,
      source,
      at: Date.now(),
    },
  }
}

export function recordFeedback(entry) {
  const state = load()
  state.items.push(entry)
  if (state.items.length > MAX) state.items = state.items.slice(-MAX)
  persist(state)
  return entry
}

export function getRecentFeedback(limit = 50) {
  const state = load()
  const take = Math.max(1, Math.min(Number(limit) || 50, MAX))
  return state.items.slice(-take).reverse()
}
