import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const DIR = '/tmp/pd-live-rooms'
const memory = globalThis.__pdLiveRooms || (globalThis.__pdLiveRooms = new Map())

export function emptyRoom() {
  return { messages: [], seats: {}, startedAt: 0, extraMs: 0 }
}

export function roomIdFrom(raw) {
  const id = String(raw || '').trim()
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(id)) return ''
  return id
}

export function applyEvent(state, event) {
  if (!event || typeof event !== 'object') return state
  const next = {
    messages: Array.isArray(state.messages) ? [...state.messages] : [],
    seats: state.seats && typeof state.seats === 'object' ? { ...state.seats } : {},
    startedAt: Number(state.startedAt) || 0,
    extraMs: Number(state.extraMs) || 0,
  }
  const kind = event.kind
  if (kind === 'hello') {
    const seat = event.seat === 'guest' ? 'guest' : event.seat === 'host' ? 'host' : ''
    if (seat) {
      next.seats[seat] = {
        name: String(event.name || '').slice(0, 32),
        photo: typeof event.photo === 'string' ? event.photo.slice(0, 80_000) : null,
        startedAt: Number(event.startedAt) || 0,
        extraMs: Number(event.extraMs) || 0,
      }
    }
    const startedAt = Number(event.startedAt) || 0
    if (startedAt > 0 && (next.startedAt === 0 || startedAt < next.startedAt)) next.startedAt = startedAt
    const extraMs = Number(event.extraMs) || 0
    if (extraMs > next.extraMs) next.extraMs = extraMs
  }
  if (kind === 'chat') {
    const text = String(event.text || '').trim().slice(0, 2000)
    const id = Number(event.id) || 0
    const seat = event.seat === 'guest' ? 'guest' : 'host'
    if (text && id > 0 && !next.messages.some((msg) => msg.id === id && msg.text === text)) {
      next.messages.push({
        id,
        seat,
        name: String(event.name || '').slice(0, 32),
        text,
      })
      next.messages = next.messages.sort((a, b) => a.id - b.id).slice(-80)
    }
  }
  if (kind === 'extend') {
    const extraMs = Number(event.extraMs) || 0
    if (extraMs > next.extraMs) next.extraMs = extraMs
  }
  return next
}

export function snapshotAfter(state, after = 0) {
  const since = Number(after) || 0
  return {
    messages: (state.messages || []).filter((msg) => msg.id > since),
    seats: state.seats || {},
    startedAt: Number(state.startedAt) || 0,
    extraMs: Number(state.extraMs) || 0,
  }
}

function filePath(room) {
  return `${DIR}/${room}.json`
}

export function loadRoom(room) {
  if (memory.has(room)) return memory.get(room)
  try {
    const parsed = JSON.parse(readFileSync(filePath(room), 'utf8'))
    if (parsed && typeof parsed === 'object') {
      memory.set(room, parsed)
      return parsed
    }
  } catch {
    /* missing */
  }
  const empty = emptyRoom()
  memory.set(room, empty)
  return empty
}

export function saveRoom(room, state) {
  memory.set(room, state)
  try {
    mkdirSync(DIR, { recursive: true })
    writeFileSync(filePath(room), JSON.stringify(state))
  } catch {
    /* ephemeral */
  }
}
