import { Peer, type DataConnection } from 'peerjs'
import { useEffect, useRef, useState } from 'react'
import type { ChatMsg } from './demoChat'
import { followFromWindow } from './roomSession'

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

export function useLiveChat(roomId: string, seat: Seat, myName: string, session: { startedAt: number; extraMs: number }) {
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

  useEffect(() => {
    myNameRef.current = myName
    sessionRef.current = session
    seatRef.current = seat
  })

  const upsert = (msg: ChatMsg) => {
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msg.id && m.text === msg.text)) return prev
      const next = [...prev, msg].sort((a, b) => a.id - b.id)
      writeStored(roomId, next)
      return next
    })
  }

  const broadcast = (payload: Wire) => {
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
      setPartnerName(payload.name)
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
    })

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
        if (conns.current.length === 0) setLinked(false)
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
        /* guest may not be online yet; retry below */
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
    // ingest reads seatRef; reconnect when the seat or room changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, seat, myName])

  useEffect(() => {
    if (!myName.trim() || conns.current.length === 0) return
    broadcast({
      kind: 'hello',
      seat,
      name: myName,
      startedAt: session.startedAt,
      extraMs: session.extraMs,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myName, session.startedAt, session.extraMs, roomId, seat])

  const sendChatMessage = () => {
    const text = chatInput.trim()
    if (!text || !myName.trim()) return
    const wire: ChatWire = { kind: 'chat', id: Date.now(), seat, name: myName.trim(), text }
    upsert({ id: wire.id, sender: 'me', text, name: myName.trim() })
    setChatInput('')
    broadcast(wire)
  }

  const pickSuggestedLine = (line: string) => {
    if (chatInput.trim() === line) sendChatMessage()
    else setChatInput(line)
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
