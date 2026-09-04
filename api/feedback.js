import { getRecentFeedback, normalizeFeedback, recordFeedback } from './feedback-store.js'
import { authorizeStats } from './stats-auth.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-stats-key')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
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

  if (req.method === 'POST') {
    const body = await readBody(req)
    const parsed = normalizeFeedback(body)
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error })
      return
    }
    recordFeedback(parsed.entry)
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'GET') {
    const auth = authorizeStats(req)
    if (!auth.ok) {
      res.status(auth.status).json({ error: auth.error })
      return
    }
    res.status(200).json({ feedback: getRecentFeedback(50) })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
