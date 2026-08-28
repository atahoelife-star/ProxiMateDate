import Stripe from 'stripe'

const PLANS = {
  dinner: { name: 'Virtual Dinner Date', amount: 999, successPath: '/restaurant?paid=1' },
  movie: { name: 'Movie Night', amount: 1499, successPath: '/movie-night?paid=1' },
  premium: { name: 'Premium Romance', amount: 2499, successPath: '/date-room?paid=1' },
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
  const plan = PLANS[body?.plan]
  if (!plan) {
    res.status(400).json({ error: 'unknown_plan' })
    return
  }

  try {
    const stripe = new Stripe(secret)
    const origin = siteOrigin(req)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'pay',
      billing_address_collection: 'auto',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: plan.amount,
            product_data: { name: `ProxiMateDate — ${plan.name}` },
          },
        },
      ],
      success_url: `${origin}${plan.successPath}`,
      cancel_url: `${origin}/pricing`,
    })

    if (!session.url) {
      res.status(500).json({ error: 'no_checkout_url' })
      return
    }
    res.status(200).json({ url: session.url })
  } catch {
    res.status(500).json({ error: 'checkout_failed' })
  }
}
