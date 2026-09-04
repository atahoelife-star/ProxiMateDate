import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../../data/plans'
import { FIRST_DATE_PRICE, LIST_PRICE, payCta } from '../../data/prices'
import { WaitlistForm } from '../WaitlistForm'
import { firstDateStillOpen } from '../../lib/firstDateOffer'
import { startStripeCheckout, type PaidPlanId } from '../../lib/stripeCheckout'

const COPY: Record<'dinner' | 'movie', { kicker: string; title: string; plan: 'dinner' | 'movie'; duration: string }> = {
  dinner: {
    kicker: 'DINNER DATE',
    title: 'Restaurant Date',
    plan: 'dinner',
    duration: '90 minutes',
  },
  movie: {
    kicker: 'MOVIE NIGHT',
    title: 'Movie Night',
    plan: 'movie',
    duration: '2.5 hours',
  },
}

type RoomPaywallProps = {
  room: 'dinner' | 'movie'
}

export function RoomPaywall({ room }: RoomPaywallProps) {
  const copy = COPY[room]
  const premium = PLANS.find((p) => p.id === 'premium')
  const [firstDate] = useState(() => firstDateStillOpen())
  const [busy, setBusy] = useState<PaidPlanId | null>(null)
  const [waitlist, setWaitlist] = useState<PaidPlanId | null>(null)
  const [checkoutError, setCheckoutError] = useState(false)
  const list = LIST_PRICE[copy.plan]
  const promo = FIRST_DATE_PRICE[copy.plan]
  const blurb = firstDate
    ? `First date ${promo} with a card on Stripe. Then the evening starts for ${copy.duration}. After that, ${list}. Your date can join on the follow link without paying again.`
    : `Pay ${list} with a card on Stripe. Then the evening starts for ${copy.duration}. Your date can join on the follow link without paying again.`

  const pay = async (planId: PaidPlanId) => {
    setBusy(planId)
    setCheckoutError(false)
    const returnTo = room === 'dinner' ? '/restaurant' : '/movie-night'
    const result = await startStripeCheckout(planId, {
      returnTo: planId === 'premium' ? '/date-room' : returnTo,
      cancelTo: returnTo,
    })
    setBusy(null)
    if (result === 'waitlist') setWaitlist(planId)
    if (result === 'error') setCheckoutError(true)
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="text-[#C9A962] text-xs tracking-[3px] mb-3">{copy.kicker}</div>
      <h1 className="text-[#F8F4ED] text-3xl mb-3">{copy.title}</h1>
      <p className="text-[#A8988A] text-[15px] leading-relaxed mb-8">{blurb}</p>

      {waitlist ? (
        <div className="card p-6">
          <p className="text-[#A8988A] text-sm mb-4">
            Leave your email and we’ll follow up about this date night.
          </p>
          <WaitlistForm intent="paid-room-waitlist" plan={waitlist} submitLabel="Join the waitlist" />
        </div>
      ) : (
        <div className="space-y-3">
          {checkoutError && (
            <p className="text-[#E8A0B8] text-sm">Couldn’t open Stripe. Tap pay to try again.</p>
          )}
          <button
            type="button"
            className="btn btn-gold w-full py-4"
            disabled={busy !== null}
            onClick={() => pay(copy.plan)}
          >
            {busy === copy.plan ? 'Opening Stripe…' : payCta(copy.plan, firstDate)}
          </button>
          {premium && (
            <button
              type="button"
              className="btn btn-outline w-full py-3.5 text-sm"
              disabled={busy !== null}
              onClick={() => pay('premium')}
            >
              {busy === 'premium'
                ? 'Opening Stripe…'
                : `${payCta('premium', firstDate)} — dinner + movie`}
            </button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-[#7A6B5F] mt-6">
        Pay with a card on Stripe. We do not send you to PayPal, Venmo, or Cash App.
      </p>
      <p className="text-center mt-6">
        <Link to="/date-night" className="text-[#C9A962] underline text-sm">
          Free Date Night is free for 30 minutes
        </Link>
      </p>
    </div>
  )
}
