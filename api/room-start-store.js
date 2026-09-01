import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const FILE = '/tmp/pd-room-starts.json'
const KINDS = new Set(['free', 'dinner', 'movie'])

const memory = globalThis.__pdRoomStarts || (globalThis.__pdRoomStarts = { seen: {}, counts: { free: 0, dinner: 0, movie: 0 } })

function emptyCounts() {
  return { free: 0, dinner: 0, movie: 0 }
}

function load() {
  if (globalThis.__pdRoomStartsLoaded) return memory
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
    if (parsed && typeof parsed === 'object') {
      if (parsed.seen && typeof parsed.seen === 'object') Object.assign(memory.seen, parsed.seen)
      if (parsed.counts && typeof parsed.counts === 'object') {
        memory.counts = { ...emptyCounts(), ...parsed.counts }
      }
    }
  } catch {
    /* first run or ephemeral disk */
  }
  globalThis.__pdRoomStartsLoaded = true
  return memory
}

function persist(state) {
  try {
    mkdirSync('/tmp', { recursive: true })
    writeFileSync(FILE, JSON.stringify({ seen: state.seen, counts: state.counts }))
  } catch {
    /* same durability as live chat */
  }
}

export function isRoomStartKind(raw) {
  return KINDS.has(String(raw || ''))
}

export function recordRoomStart(kind, room) {
  if (!isRoomStartKind(kind) || !room) {
    return { recorded: false, counts: getRoomStartCounts() }
  }
  const state = load()
  const key = `${kind}:${room}`
  if (state.seen[key]) {
    return { recorded: false, counts: { ...emptyCounts(), ...state.counts } }
  }
  state.seen[key] = Date.now()
  state.counts[kind] = (Number(state.counts[kind]) || 0) + 1
  persist(state)
  return { recorded: true, counts: { ...emptyCounts(), ...state.counts } }
}

export function getRoomStartCounts() {
  const state = load()
  return {
    free: Number(state.counts.free) || 0,
    dinner: Number(state.counts.dinner) || 0,
    movie: Number(state.counts.movie) || 0,
  }
}
