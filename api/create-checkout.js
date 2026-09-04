import Stripe from 'stripe'
import {
  LIST_AMOUNTS,
  PAID_EVENING_PLANS,
  PLAN_NAMES,
  SUCCESS_PATHS,
  checkoutAmount,
  isPlanId,
} from './plan-amounts.js'

const ALLOWED_PATHS = new Set(['/restaurant', '/movie-night', '/date-room', '/date-night', '/pricing'])

function cookieSaysPaid(req) {
  const raw = req.headers?.cookie || req.headers?.Cookie || ''
  return /(?:^|;\s*)pd_first_paid=1(?:;|$)/.test(String(raw))
}

function wantsFirstDate(req, body, planId) {
  if (!PAID_EVENING_PLANS.has(planId)) return false
  if (cookieSaysPaid(req)) return false
  return body?.firstDate === true || body?.promo === 'first-date'
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

function siteOrigin(req) {
  const fromEnv = process.env.PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const origin = req.headers.origin
  if (origin && typeof origin === 'string') return origin.replace(/\/$/, '')
  const host = req.headers.host
  if (host) return `https://${host}`
  return 'https://www.proximatedate.com'
}

function safePath(raw, fallback) {
  if (typeof raw !== 'string') return fallback
  const path = raw.split('?')[0]
  if (!ALLOWED_PATHS.has(path)) return fallback
  return path
}

function withSessionQuery(origin, path, rawReturn, planId) {
  const params = new URLSearchParams()
  if (typeof rawReturn === 'string' && rawReturn.includes('?')) {
    const incoming = new URLSearchParams(rawReturn.slice(rawReturn.indexOf('?') + 1))
    for (const key of ['room', 'started', 'follow']) {
      const value = incoming.get(key)
      if (value) params.set(key, value)
    }
  }
  params.set('paid', '1')
  params.set('plan', planId)
  return `${origin}${path}?${params.toString()}`
}

function cancelUrl(origin, rawCancel, fallbackPath) {
  const path = safePath(rawCancel, fallbackPath)
  if (typeof rawCancel === 'string' && rawCancel.includes('?')) {
    const incoming = new URLSearchParams(rawCancel.slice(rawCancel.indexOf('?') + 1))
    const params = new URLSearchParams()
    for (const key of ['room', 'started', 'follow']) {
      const value = incoming.get(key)
      if (value) params.set(key, value)
    }
    const qs = params.toString()
    return qs ? `${origin}${path}?${qs}` : `${origin}${path}`
  }
  return `${origin}${path}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    res.status(503).json({ error: 'not_configured' })
    return
  }

  const body = await readBody(req)
  const planId = body?.plan
  if (!isPlanId(planId)) {
    res.status(400).json({ error: 'unknown_plan' })
    return
  }

  const firstDate = wantsFirstDate(req, body, planId)
  const amount = checkoutAmount(planId, firstDate)
  const name = PLAN_NAMES[planId]
  const productName = firstDate ? `ProxiMateDate — ${name} (first date)` : `ProxiMateDate — ${name}`

  try {
    const stripe = new Stripe(secret)
    const origin = siteOrigin(req)
    const successPath = safePath(body?.returnTo, SUCCESS_PATHS[planId])
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'pay',
      billing_address_collection: 'auto',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: { name: productName },
          },
        },
      ],
      success_url: withSessionQuery(origin, successPath, body?.returnTo, planId),
      cancel_url: cancelUrl(origin, body?.cancelTo, '/pricing'),
      metadata: {
        plan: planId,
        promo: firstDate ? 'first-date' : 'list',
        list_amount: String(LIST_AMOUNTS[planId]),
        charged_amount: String(amount),
      },
    })

    if (!session.url) {
      res.status(500).json({ error: 'no_checkout_url' })
      return
    }
    res.status(200).json({
      url: session.url,
      amount,
      promo: firstDate ? 'first-date' : 'list',
    })
  } catch {
    res.status(500).json({ error: 'checkout_failed' })
  }
}
