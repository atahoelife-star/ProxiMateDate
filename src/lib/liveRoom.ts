import { Peer, type DataConnection } from 'peerjs'
import { useEffect, useRef, useState } from 'react'
import type { ChatMsg } from './demoChat'
import { followFromWindow, writeFollowQuery } from './roomSession'

export type Seat = 'host' | 'guest'

export function seatFromWindow(): Seat {
  return followFromWindow() ? 'guest' : 'host'
}

export function readSeatName(roomId: string, seat: Seat) {
  try {
    return sessionStorage.getItem(`pd-name:${roomId}:${seat}`)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function writeSeatName(roomId: string, seat: Seat, name: string) {
  try {
    sessionStorage.setItem(`pd-name:${roomId}:${seat}`, name.trim())
  } catch {
    /* private mode */
  }
}

function peerId(roomId: string, seat: Seat) {
  const slug = roomId.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'room'
  return `pd${slug}${seat === 'host' ? 'H' : 'G'}`
}

type HelloMsg = {
  kind: 'hello'
  seat: Seat
  name: string
  startedAt: number
  extraMs: number
  photo?: string | null
}

type ChatWire = {
  kind: 'chat'
  id: number
  seat: Seat
  name: string
  text: string
}

type ExtendWire = { kind: 'extend'; extraMs: number }

type Wire = HelloMsg | ChatWire | ExtendWire

type SeatSnap = { name: string; photo?: string | null; startedAt: number; extraMs: number }

type RoomSnap = {
  messages: { id: number; seat: Seat; name: string; text: string }[]
  seats: Partial<Record<Seat, SeatSnap>>
  startedAt: number
  extraMs: number
}

function storageKey(roomId: string) {
  return `pd-live-chat:${roomId}`
}

function readStored(roomId: string): ChatMsg[] {
  try {
    const raw = localStorage.getItem(storageKey(roomId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMsg[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStored(roomId: string, messages: ChatMsg[]) {
  try {
    localStorage.setItem(storageKey(roomId), JSON.stringify(messages.slice(-80)))
  } catch {
    /* quota */
  }
}

async function postLive(roomId: string, event: Wire) {
  try {
    await fetch('/api/live-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomId, event }),
    })
  } catch {
    /* poller retries */
  }
}

async function pullLive(roomId: string, after: number): Promise<RoomSnap | null> {
  try {
    const response = await fetch(`/api/live-room?room=${encodeURIComponent(roomId)}&after=${after}`)
    if (!response.ok) return null
    return (await response.json()) as RoomSnap
  } catch {
    return null
  }
}

/** Keep host/guest seats apart. A second person on the host URL still sits as guest. */
export async function takeSeat(roomId: string, name: string, preferred: Seat): Promise<Seat> {
  const trimmed = name.trim()
  if (!trimmed) return preferred
  if (preferred === 'guest' || followFromWindow()) {
    writeSeatName(roomId, 'guest', trimmed)
    return 'guest'
  }
  const snap = await pullLive(roomId, 0)
  const hostName = snap?.seats?.host?.name?.trim() || ''
  if (hostName && hostName !== trimmed) {
    writeFollowQuery(roomId)
    writeSeatName(roomId, 'guest', trimmed)
    return 'guest'
  }
  writeSeatName(roomId, 'host', trimmed)
  return 'host'
}

export function useLiveChat(
  roomId: string,
  seat: Seat,
  myName: string,
  session: { startedAt: number; extraMs: number },
  youPhoto?: string | null,
) {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => readStored(roomId))
  const [chatInput, setChatInput] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null)
  const [remoteStartedAt, setRemoteStartedAt] = useState(0)
  const [remoteExtraMs, setRemoteExtraMs] = useState(0)
  const [linked, setLinked] = useState(false)
  const conns = useRef<DataConnection[]>([])
  const myNameRef = useRef(myName)
  const sessionRef = useRef(session)
  const seatRef = useRef(seat)
  const youPhotoRef = useRef(youPhoto)
  const afterRef = useRef(0)

  useEffect(() => {
    myNameRef.current = myName
    sessionRef.current = session
    seatRef.current = seat
    youPhotoRef.current = youPhoto
  })

  const upsert = (msg: ChatMsg) => {
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msg.id && m.text === msg.text)) return prev
      const next = [...prev, msg].sort((a, b) => a.id - b.id)
      writeStored(roomId, next)
      afterRef.current = Math.max(afterRef.current, msg.id)
      return next
    })
  }

  const broadcast = (payload: Wire) => {
    void postLive(roomId, payload)
    for (const conn of conns.current) {
      if (conn.open) conn.send(payload)
    }
    try {
      const ch = new BroadcastChannel(`pd-live:${roomId}`)
      ch.postMessage(payload)
      ch.close()
    } catch {
      /* unsupported */
    }
  }

  const ingest = (payload: Wire, fromSelf: boolean) => {
    if (payload.kind === 'hello') {
      if (payload.seat === seatRef.current) return
      const name = payload.name?.trim()
      if (name) setPartnerName(name)
      if (payload.photo) setPartnerPhoto(payload.photo)
      if (payload.startedAt > 0) setRemoteStartedAt(payload.startedAt)
      if (payload.extraMs > 0) setRemoteExtraMs(payload.extraMs)
      setLinked(true)
      return
    }
    if (payload.kind === 'extend') {
      setRemoteExtraMs(payload.extraMs)
      return
    }
    if (payload.kind !== 'chat') return
    const mine = payload.seat === seatRef.current
    if (mine && fromSelf) return
    upsert({
      id: payload.id,
      sender: mine ? 'me' : 'partner',
      text: payload.text,
      name: payload.name,
    })
  }

  const ingestSnap = (snap: RoomSnap) => {
    const other: Seat = seatRef.current === 'host' ? 'guest' : 'host'
    const them = snap.seats?.[other]
    if (them?.name?.trim()) {
      setPartnerName(them.name.trim())
      setLinked(true)
    }
    if (them?.photo) setPartnerPhoto(them.photo)
    if (snap.startedAt > 0) setRemoteStartedAt(snap.startedAt)
    if (snap.extraMs > 0) setRemoteExtraMs(snap.extraMs)
    for (const msg of snap.messages || []) {
      ingest(
        { kind: 'chat', id: msg.id, seat: msg.seat, name: msg.name, text: msg.text },
        false,
      )
    }
  }

  useEffect(() => {
    if (!roomId || !myName.trim()) return
    let peer: Peer | null = null
    let channel: BroadcastChannel | null = null
    let cancelled = false

    const hello = (): HelloMsg => ({
      kind: 'hello',
      seat,
      name: myNameRef.current,
      startedAt: sessionRef.current.startedAt,
      extraMs: sessionRef.current.extraMs,
      photo: youPhotoRef.current,
    })

    void postLive(roomId, hello())

    const poll = window.setInterval(() => {
      if (cancelled) return
      void pullLive(roomId, afterRef.current).then((snap) => {
        if (!snap || cancelled) return
        ingestSnap(snap)
      })
    }, 900)

    const attach = (conn: DataConnection) => {
      if (conns.current.includes(conn)) return
      conns.current.push(conn)
      conn.on('open', () => {
        setLinked(true)
        conn.send(hello())
      })
      conn.on('data', (data) => ingest(data as Wire, false))
      conn.on('close', () => {
        conns.current = conns.current.filter((c) => c !== conn)
      })
    }

    try {
      channel = new BroadcastChannel(`pd-live:${roomId}`)
      channel.onmessage = (event) => ingest(event.data as Wire, false)
    } catch {
      channel = null
    }

    try {
      peer = new Peer(peerId(roomId, seat), { debug: 0 })
      peer.on('open', () => {
        if (cancelled) return
        const other = peer!.connect(peerId(roomId, seat === 'host' ? 'guest' : 'host'), { reliable: true })
        attach(other)
      })
      peer.on('connection', attach)
      peer.on('error', () => {
        /* HTTP poll still carries the room */
      })
    } catch {
      peer = null
    }

    const retry = window.setInterval(() => {
      if (cancelled || !peer || conns.current.some((c) => c.open)) return
      try {
        attach(peer.connect(peerId(roomId, seat === 'host' ? 'guest' : 'host'), { reliable: true }))
      } catch {
        /* wait */
      }
    }, 2500)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearInterval(retry)
      channel?.close()
      for (const conn of conns.current) conn.close()
      conns.current = []
      peer?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, seat, myName])

  useEffect(() => {
    if (!myName.trim()) return
    broadcast({
      kind: 'hello',
      seat,
      name: myName,
      startedAt: session.startedAt,
      extraMs: session.extraMs,
      photo: youPhoto,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myName, session.startedAt, session.extraMs, youPhoto, roomId, seat])

  const sendChatMessage = () => {
    const text = chatInput.trim()
    if (!text || !myName.trim()) return
    const wire: ChatWire = { kind: 'chat', id: Date.now(), seat, name: myName.trim(), text }
    upsert({ id: wire.id, sender: 'me', text, name: myName.trim() })
    setChatInput('')
    broadcast(wire)
  }

  const pickSuggestedLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    if (chatInput.trim() === trimmed) sendChatMessage()
    else setChatInput(trimmed)
  }

  const roomMessage = (text: string) => {
    upsert({ id: Date.now(), sender: 'system', text })
  }

  const sendExtend = (extraMs: number) => {
    broadcast({ kind: 'extend', extraMs })
  }

  const sendPhoto = (photo: string | null) => {
    broadcast({
      kind: 'hello',
      seat,
      name: myName,
      startedAt: session.startedAt,
      extraMs: session.extraMs,
      photo,
    })
  }

  return {
    chatMessages,
    chatInput,
    setChatInput,
    sendChatMessage,
    pickSuggestedLine,
    roomMessage,
    partnerName,
    partnerPhoto,
    linked,
    remoteStartedAt,
    remoteExtraMs,
    sendExtend,
    sendPhoto,
  }
}
