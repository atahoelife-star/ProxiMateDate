import { authorizeStats } from './stats-auth.js'
import { getRoomStartCounts } from './room-start-store.js'
import { collectPaidCheckoutCounts } from './stats-stripe.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-stats-key')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const auth = authorizeStats(req)
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error })
    return
  }

  const roomStarts = getRoomStartCounts()
  const stripe = await collectPaidCheckoutCounts()
  res.status(200).json({ roomStarts, stripe })
}
