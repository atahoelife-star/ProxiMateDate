import Peer, { type DataConnection } from 'peerjs'

export type WatchEvent =
  | { type: 'hello' }
  | { type: 'request-state' }
  | { type: 'video'; videoId: string; title: string }
  | { type: 'play'; time: number; at: number }
  | { type: 'pause'; time: number }
  | { type: 'seek'; time: number; playing: boolean }

export function newRoomId(): string {
  return Math.random().toString(36).slice(2, 8)
}

type SyncHandle = {
  send: (event: WatchEvent) => void
  destroy: () => void
}

export function createWatchSync(roomId: string, onEvent: (event: WatchEvent) => void): SyncHandle {
  const channel = new BroadcastChannel(`proximatedate-watch-${roomId}`)
  const connections: DataConnection[] = []
  const peers: Peer[] = []
  let destroyed = false

  const deliver = (event: WatchEvent) => {
    if (destroyed) return
    onEvent(event)
  }

  channel.onmessage = (message: MessageEvent<WatchEvent>) => {
    if (message.data?.type) deliver(message.data)
  }

  const send = (event: WatchEvent) => {
    if (destroyed) return
    try {
      channel.postMessage(event)
    } catch {
      /* ignore */
    }
    for (const conn of connections) {
      if (conn.open) conn.send(event)
    }
  }

  const attach = (conn: DataConnection) => {
    connections.push(conn)
    conn.on('data', (data) => {
      if (data && typeof data === 'object' && 'type' in data) {
        deliver(data as WatchEvent)
      }
    })
    conn.on('open', () => {
      conn.send({ type: 'hello' } satisfies WatchEvent)
      conn.send({ type: 'request-state' } satisfies WatchEvent)
    })
  }

  const hostId = `pmd-yt-${roomId}`

  const startGuest = () => {
    const guest = new Peer({ debug: 0 })
    peers.push(guest)
    guest.on('open', () => {
      const conn = guest.connect(hostId, { reliable: true })
      attach(conn)
    })
    guest.on('connection', attach)
  }

  const host = new Peer(hostId, { debug: 0 })
  peers.push(host)
  host.on('connection', attach)
  host.on('error', (err: { type?: string }) => {
    if (err.type === 'unavailable-id') {
      host.destroy()
      startGuest()
    }
  })

  return {
    send,
    destroy: () => {
      destroyed = true
      channel.close()
      for (const conn of connections) conn.close()
      for (const peer of peers) peer.destroy()
    },
  }
}
