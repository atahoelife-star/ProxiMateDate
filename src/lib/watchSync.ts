export type WatchState = {
  videoId: string
  title: string
  playing: boolean
  time: number
  at: number
  muted: boolean
  seq: number
}

const storageKey = (roomId: string) => `proximatedate-watch-${roomId}`
const channels = new Map<string, BroadcastChannel>()

export function emptyWatchState(videoId: string, title: string): WatchState {
  return {
    videoId,
    title,
    playing: false,
    time: 0,
    at: Date.now(),
    muted: false,
    seq: Date.now(),
  }
}

export function expectedTime(state: WatchState, now = Date.now()): number {
  if (!state.playing) return state.time
  return Math.max(0, state.time + (now - state.at) / 1000)
}

export function newRoomId(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function readWatchState(roomId: string): WatchState | null {
  try {
    const raw = localStorage.getItem(storageKey(roomId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as WatchState
    if (!parsed?.videoId) return null
    return parsed
  } catch {
    return null
  }
}

function channelFor(roomId: string): BroadcastChannel | null {
  const key = storageKey(roomId)
  const existing = channels.get(key)
  if (existing) return existing
  try {
    const channel = new BroadcastChannel(key)
    channels.set(key, channel)
    return channel
  } catch {
    return null
  }
}

export function writeWatchState(roomId: string, state: WatchState) {
  const next = { ...state, seq: Date.now() }
  localStorage.setItem(storageKey(roomId), JSON.stringify(next))
  channelFor(roomId)?.postMessage(next)
  return next
}

export function bootWatchState(roomId: string, videoId: string | null, isFollower = false): WatchState | null {
  const stored = readWatchState(roomId)
  if (stored && (!videoId || stored.videoId === videoId)) return stored
  if (videoId) {
    const next = emptyWatchState(videoId, 'Watch together')
    if (isFollower) next.seq = 0
    return next
  }
  return null
}

export function subscribeWatchState(roomId: string, onState: (state: WatchState) => void): () => void {
  const key = storageKey(roomId)
  let lastSeq = 0

  const ingest = (state: WatchState | null) => {
    if (!state || state.seq <= lastSeq) return
    lastSeq = state.seq
    onState(state)
  }

  ingest(readWatchState(roomId))

  const channel = channelFor(roomId)
  const onMessage = (event: MessageEvent<WatchState>) => ingest(event.data)
  if (channel) channel.addEventListener('message', onMessage)

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key || !event.newValue) return
    try {
      ingest(JSON.parse(event.newValue) as WatchState)
    } catch {
      /* ignore */
    }
  }
  window.addEventListener('storage', onStorage)

  const poll = window.setInterval(() => ingest(readWatchState(roomId)), 400)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.clearInterval(poll)
    if (channel) channel.removeEventListener('message', onMessage)
  }
}
