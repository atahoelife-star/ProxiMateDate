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

export function writeWatchState(roomId: string, state: WatchState) {
  const next = { ...state, seq: Date.now() }
  localStorage.setItem(storageKey(roomId), JSON.stringify(next))
  try {
    new BroadcastChannel(storageKey(roomId)).postMessage(next)
  } catch {
    /* BroadcastChannel missing */
  }
  return next
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

  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(key)
    channel.onmessage = (event: MessageEvent<WatchState>) => ingest(event.data)
  } catch {
    channel = null
  }

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
    channel?.close()
  }
}
