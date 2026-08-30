import { applyEvent, loadRoom, roomIdFrom, saveRoom, snapshotAfter } from './live-room-store.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function readBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch {
        return {}
      }
    }
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    const query = req.query || {}
    let room = roomIdFrom(query.room)
    let after = query.after
    if (!room) {
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
        room = roomIdFrom(url.searchParams.get('room'))
        after = url.searchParams.get('after')
      } catch {
        /* ignore */
      }
    }
    if (!room) {
      res.status(400).json({ error: 'bad_room' })
      return
    }
    res.status(200).json(snapshotAfter(loadRoom(room), after))
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = await readBody(req)
  const room = roomIdFrom(body?.room)
  if (!room) {
    res.status(400).json({ error: 'bad_room' })
    return
  }
  const next = applyEvent(loadRoom(room), body?.event)
  saveRoom(room, next)
  res.status(200).json(snapshotAfter(next, 0))
}
