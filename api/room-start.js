import { roomIdFrom } from './live-room-store.js'
import { isRoomStartKind, recordRoomStart } from './room-start-store.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
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
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = await readBody(req)
  const kind = String(body?.kind || '')
  const room = roomIdFrom(body?.room)
  if (!isRoomStartKind(kind) || !room) {
    res.status(400).json({ error: 'bad_start' })
    return
  }

  const result = recordRoomStart(kind, room)
  res.status(200).json({ ok: true, recorded: result.recorded })
}
