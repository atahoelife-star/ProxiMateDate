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
      const prev = next.seats[seat] || {}
      const photo =
        typeof event.photo === 'string'
          ? event.photo.slice(0, 80_000)
          : event.photo === null
            ? null
            : prev.photo ?? null
      next.seats[seat] = {
        name: String(event.name || prev.name || '').slice(0, 32),
        photo,
        startedAt: Number(event.startedAt) || Number(prev.startedAt) || 0,
        extraMs: Number(event.extraMs) || Number(prev.extraMs) || 0,
        clientId: String(event.clientId || prev.clientId || '').slice(0, 80),
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

/** First browser to hold the host URL stays host. A second browser becomes guest even with an empty name. */
export function claimSeatOnRoom(state, name, clientId, preferred) {
  const trimmed = String(name || '').trim().slice(0, 32)
  const cid = String(clientId || '').slice(0, 80)
  const seats = state.seats && typeof state.seats === 'object' ? state.seats : {}
  const host = seats.host
  const guest = seats.guest
  let seat
  if (cid && host?.clientId === cid) seat = 'host'
  else if (cid && guest?.clientId === cid) seat = 'guest'
  else if (preferred === 'guest') seat = 'guest'
  else if (!host) seat = 'host'
  else seat = 'guest'
  const prev = seat === 'host' ? host : guest
  return {
    state: applyEvent(state, {
      kind: 'hello',
      seat,
      name: trimmed || prev?.name || '',
      photo: typeof prev?.photo === 'string' ? prev.photo : undefined,
      startedAt: prev?.startedAt || 0,
      extraMs: prev?.extraMs || 0,
      clientId: cid || prev?.clientId || '',
    }),
    seat,
  }
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
