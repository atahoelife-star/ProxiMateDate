import { Peer, type DataConnection } from 'peerjs'
import { useEffect, useRef, useState } from 'react'
import type { ChatMsg } from './demoChat'
import { earliestStart } from './dateClock'
import { followFromWindow, writeFollowQuery } from './roomSession'

const CLIENT_KEY = 'pd-client-id'

export function readClientId() {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let id = sessionStorage.getItem(CLIENT_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(CLIENT_KEY, id)
    }
    return id
  } catch {
    return `tmp-${Math.random().toString(36).slice(2, 12)}`
  }
}

export function photoScopeFor(roomId: string) {
  return `${roomId}-${readClientId()}`
}

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

type StartWire = { kind: 'start'; startedAt: number }

type Wire = HelloMsg | ChatWire | ExtendWire | StartWire

type SeatSnap = { name: string; photo?: string | null; startedAt: number; extraMs: number; clientId?: string }

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

async function postClaim(roomId: string, name: string, preferred: Seat): Promise<Seat | null> {
  const response = await fetch('/api/live-room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: roomId,
      event: { kind: 'claim', name, clientId: readClientId(), preferred },
    }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { seat?: Seat }
  if (data.seat === 'guest' || data.seat === 'host') return data.seat
  return null
}

function rememberSeat(roomId: string, seat: Seat, name?: string) {
  if (seat === 'guest') writeFollowQuery(roomId)
  if (name?.trim()) writeSeatName(roomId, seat, name.trim())
}

/** Hold the host chair as soon as the first browser opens the room, before they type a name. */
export async function holdHostSeat(roomId: string): Promise<Seat> {
  if (followFromWindow()) return 'guest'
  try {
    const seat = await postClaim(roomId, '', 'host')
    if (seat) {
      rememberSeat(roomId, seat)
      return seat
    }
  } catch {
    /* fall through */
  }
  return 'host'
}

/** Keep host/guest seats apart. A second person on the host URL still sits as guest. */
export async function takeSeat(roomId: string, name: string, preferred: Seat): Promise<Seat> {
  const trimmed = name.trim()
  if (!trimmed) return preferred
  const want: Seat = preferred === 'guest' || followFromWindow() ? 'guest' : 'host'
  try {
    const seat = await postClaim(roomId, trimmed, want)
    if (seat) {
      rememberSeat(roomId, seat, trimmed)
      return seat
    }
  } catch {
    /* fall through */
  }
  if (want === 'guest') {
    rememberSeat(roomId, 'guest', trimmed)
    return 'guest'
  }
  const snap = await pullLive(roomId, 0)
  const hostName = snap?.seats?.host?.name?.trim() || ''
  const hostId = snap?.seats?.host?.clientId || ''
  if ((hostName && hostName !== trimmed) || (hostId && hostId !== readClientId())) {
    rememberSeat(roomId, 'guest', trimmed)
    return 'guest'
  }
  rememberSeat(roomId, 'host', trimmed)
  return 'host'
}

export function useLiveSeat(roomId: string) {
  const [seat, setSeat] = useState<Seat>(seatFromWindow)
  const [myName, setMyName] = useState(() => readSeatName(roomId, seatFromWindow()))

  useEffect(() => {
    if (followFromWindow()) return
    let cancelled = false
    void holdHostSeat(roomId).then((next) => {
      if (cancelled) return
      setSeat(next)
      setMyName((prev) => readSeatName(roomId, next) || prev)
    })
    return () => {
      cancelled = true
    }
  }, [roomId])

  const join = async (name: string) => {
    const next = await takeSeat(roomId, name, seat)
    setSeat(next)
    setMyName(name.trim())
  }

  const rename = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    writeSeatName(roomId, seat, trimmed)
    setMyName(trimmed)
  }

  return { seat, myName, join, rename, photoScope: photoScopeFor(roomId) }
}

export function useLiveChat(
  roomId: string,
  seat: Seat,
  myName: string,
  youPhoto?: string | null,
  options?: { armClock?: boolean },
) {
  const armClock = options?.armClock ?? false
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => readStored(roomId))
  const [chatInput, setChatInput] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null)
  const [remoteStartedAt, setRemoteStartedAt] = useState(0)
  const [remoteExtraMs, setRemoteExtraMs] = useState(0)
  const [linked, setLinked] = useState(false)
  const conns = useRef<DataConnection[]>([])
  const myNameRef = useRef(myName)
  const seatRef = useRef(seat)
  const youPhotoRef = useRef(youPhoto)
  const startedAtRef = useRef(0)
  const extraMsRef = useRef(0)
  const afterRef = useRef(0)
  const [armedAt, setArmedAt] = useState(0)
  const clockStart = earliestStart(remoteStartedAt, armedAt)

  useEffect(() => {
    myNameRef.current = myName
    seatRef.current = seat
    youPhotoRef.current = youPhoto
    startedAtRef.current = clockStart
    extraMsRef.current = remoteExtraMs
  })

  const adoptStart = (startedAt: number) => {
    if (!(startedAt > 0)) return
    setRemoteStartedAt((prev) => (prev > 0 ? Math.min(prev, startedAt) : startedAt))
  }

  const adoptExtra = (extraMs: number) => {
    if (!(extraMs > 0)) return
    setRemoteExtraMs((prev) => (extraMs > prev ? extraMs : prev))
  }

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
      adoptStart(payload.startedAt)
      adoptExtra(payload.extraMs)
      setLinked(true)
      return
    }
    if (payload.kind === 'start') {
      adoptStart(payload.startedAt)
      return
    }
    if (payload.kind === 'extend') {
      adoptExtra(payload.extraMs)
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
    adoptStart(snap.startedAt)
    adoptExtra(snap.extraMs)
    for (const msg of snap.messages || []) {
      ingest(
        { kind: 'chat', id: msg.id, seat: msg.seat, name: msg.name, text: msg.text },
        false,
      )
    }
  }

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    const pull = () => {
      void pullLive(roomId, afterRef.current).then((snap) => {
        if (!snap || cancelled) return
        ingestSnap(snap)
      })
    }
    pull()
    const poll = window.setInterval(pull, 900)
    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    // Only the guest arms the shared clock. Host opening the room must not POST start.
    if (!roomId || !armClock) return
    const startedAt = Date.now()
    const wire: StartWire = { kind: 'start', startedAt }
    const timer = window.setTimeout(() => {
      setArmedAt((prev) => (prev > 0 ? prev : startedAt))
    }, 0)
    void postLive(roomId, wire)
    try {
      const ch = new BroadcastChannel(`pd-live:${roomId}`)
      ch.postMessage(wire)
      ch.close()
    } catch {
      /* unsupported */
    }
    return () => window.clearTimeout(timer)
  }, [roomId, armClock])

  useEffect(() => {
    if (!roomId) return
    let peer: Peer | null = null
    let channel: BroadcastChannel | null = null
    let cancelled = false

    const hello = (): HelloMsg => ({
      kind: 'hello',
      seat,
      name: myNameRef.current,
      startedAt: startedAtRef.current,
      extraMs: extraMsRef.current,
      photo: youPhotoRef.current,
    })

    const attach = (conn: DataConnection) => {
      if (conns.current.includes(conn)) return
      conns.current.push(conn)
      conn.on('open', () => {
        setLinked(true)
        if (myNameRef.current.trim()) conn.send(hello())
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
      window.clearInterval(retry)
      channel?.close()
      for (const conn of conns.current) conn.close()
      conns.current = []
      peer?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, seat])

  useEffect(() => {
    if (!myName.trim()) return
    broadcast({
      kind: 'hello',
      seat,
      name: myName,
      startedAt: startedAtRef.current,
      extraMs: extraMsRef.current,
      photo: youPhoto,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myName, clockStart, remoteExtraMs, youPhoto, roomId, seat])

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
    adoptExtra(extraMs)
    broadcast({ kind: 'extend', extraMs })
  }

  const sendPhoto = (photo: string | null) => {
    broadcast({
      kind: 'hello',
      seat,
      name: myName,
      startedAt: startedAtRef.current,
      extraMs: extraMsRef.current,
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
    remoteStartedAt: clockStart,
    remoteExtraMs,
    sendExtend,
    sendPhoto,
  }
}
