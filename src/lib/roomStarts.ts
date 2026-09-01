export type RoomStartKind = 'free' | 'dinner' | 'movie'

const PRODUCTION = 'https://www.proximatedate.com/api/room-start'

function endpoints() {
  if (typeof window === 'undefined') return ['/api/room-start']
  const origin = window.location.origin.replace(/\/$/, '')
  if (origin === 'https://proximatedate.com') return [PRODUCTION]
  return [`${origin}/api/room-start`]
}

/** Count a unique room once per kind. Free dates never hit Stripe unless they extend. */
export function reportRoomStart(kind: RoomStartKind, roomId: string) {
  if (typeof window === 'undefined') return
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(roomId)) return
  const token = `pd-room-start:${kind}:${roomId}`
  try {
    if (sessionStorage.getItem(token)) return
    sessionStorage.setItem(token, '1')
  } catch {
    /* still post; the server de-dupes by room */
  }

  const payload = JSON.stringify({ kind, room: roomId })
  void (async () => {
    for (const url of endpoints()) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        })
        if (response.ok) return
      } catch {
        continue
      }
    }
  })()
}
