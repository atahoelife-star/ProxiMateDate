import { timingSafeEqual } from 'node:crypto'

function providedKey(req) {
  const headers = req.headers || {}
  const header = headers['x-stats-key'] || headers['X-Stats-Key']
  if (typeof header === 'string' && header) return header

  const auth = headers.authorization || headers.Authorization
  if (typeof auth === 'string' && /^Basic /i.test(auth)) {
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8')
      const colon = decoded.indexOf(':')
      return colon >= 0 ? decoded.slice(colon + 1) : decoded
    } catch {
      /* ignore */
    }
  }

  const query = req.query || {}
  if (typeof query.key === 'string') return query.key
  if (Array.isArray(query.key) && typeof query.key[0] === 'string') return query.key[0]

  try {
    const url = new URL(req.url || '', `http://${headers.host || 'localhost'}`)
    return url.searchParams.get('key') || ''
  } catch {
    return ''
  }
}

function keysMatch(expected, provided) {
  const left = Buffer.from(String(expected))
  const right = Buffer.from(String(provided))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** @returns {{ ok: true } | { ok: false, status: number, error: string }} */
export function authorizeStats(req) {
  const expected = process.env.STATS_KEY
  if (!expected) return { ok: false, status: 503, error: 'not_configured' }
  const provided = providedKey(req)
  if (!provided || !keysMatch(expected, provided)) return { ok: false, status: 401, error: 'unauthorized' }
  return { ok: true }
}
