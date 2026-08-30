import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../../data/plans'
import { WaitlistForm } from '../WaitlistForm'
import { startStripeCheckout, type PaidPlanId } from '../../lib/stripeCheckout'

const COPY: Record<'dinner' | 'movie', { kicker: string; title: string; plan: PaidPlanId; blurb: string }> = {
  dinner: {
    kicker: 'DINNER DATE',
    title: 'Restaurant Date',
    plan: 'dinner',
    blurb: 'Pay $9.99 with a card in the browser (Stripe Checkout). Then the host seats you for 90 minutes. Your date can join on the follow link without paying again.',
  },
  movie: {
    kicker: 'MOVIE NIGHT',
    title: 'Movie Night',
    plan: 'movie',
    blurb: 'Pay $14.99 with a card in the browser (Stripe Checkout). Then the theater walk-in starts — 2.5 hours. Your date can join on the follow link without paying again.',
  },
}

type RoomPaywallProps = {
  room: 'dinner' | 'movie'
}

export function RoomPaywall({ room }: RoomPaywallProps) {
  const copy = COPY[room]
  const plan = PLANS.find((p) => p.id === copy.plan)
  const premium = PLANS.find((p) => p.id === 'premium')
  const [busy, setBusy] = useState<PaidPlanId | null>(null)
  const [waitlist, setWaitlist] = useState<PaidPlanId | null>(null)

  const pay = async (planId: PaidPlanId) => {
    setBusy(planId)
    const returnTo = room === 'dinner' ? '/restaurant' : '/movie-night'
    const result = await startStripeCheckout(planId, {
      returnTo: planId === 'premium' ? '/date-room' : returnTo,
      cancelTo: returnTo,
    })
    setBusy(null)
    if (result === 'waitlist') setWaitlist(planId)
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="text-[#C9A962] text-xs tracking-[3px] mb-3">{copy.kicker}</div>
      <h1 className="text-[#F8F4ED] text-3xl mb-3">{copy.title}</h1>
      <p className="text-[#A8988A] text-[15px] leading-relaxed mb-8">{copy.blurb}</p>

      {waitlist ? (
        <div className="card p-6">
          <p className="text-[#A8988A] text-sm mb-4">
            Stripe Checkout is not available right now. Leave an email. We never ask for a card number on this page, and we do not send you to PayPal, Venmo, or Cash App.
          </p>
          <WaitlistForm intent="paid-room-waitlist" plan={waitlist} submitLabel="Join the waitlist" />
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            className="btn btn-gold w-full py-4"
            disabled={busy !== null}
            onClick={() => pay(copy.plan)}
          >
            {busy === copy.plan ? 'Opening Stripe…' : plan?.cta ?? 'Pay with card'}
          </button>
          {premium && (
            <button
              type="button"
              className="btn btn-outline w-full py-3.5 text-sm"
              disabled={busy !== null}
              onClick={() => pay('premium')}
            >
              {busy === 'premium' ? 'Opening Stripe…' : `${premium.cta} — dinner + movie`}
            </button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-[#7A6B5F] mt-6">
        Card on Stripe’s page. Apple Pay / Google Pay only if your phone already offers them there. No PayPal, Venmo, or Cash App.
      </p>
      <p className="text-center mt-6">
        <Link to="/date-night" className="text-[#C9A962] underline text-sm">
          Free Date Night is free for 30 minutes
        </Link>
      </p>
    </div>
  )
}
