import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { PLANS, type Plan } from '../data/plans'
import { WaitlistForm } from '../components/WaitlistForm'
import { startStripeCheckout, type PaidPlanId } from '../lib/stripeCheckout'

export function PricingPage() {
  const [waitlistPlan, setWaitlistPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState(false)

  const onPaidCta = async (plan: Plan) => {
    if (plan.id === 'free') return
    setBusy(plan.id)
    setCheckoutError(false)
    const result = await startStripeCheckout(plan.id as PaidPlanId, {
      returnTo: plan.roomPath,
      cancelTo: '/pricing',
    })
    setBusy(null)
    if (result === 'waitlist') setWaitlistPlan(plan)
    if (result === 'error') setCheckoutError(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-6">
        <div className="text-[#C9A962] tracking-[3px] text-sm mb-3">PAY IN THE BROWSER</div>
        <h1 className="text-[#F8F4ED]">Pricing</h1>
        <p className="mt-4 text-xl text-[#A8988A] max-w-xl mx-auto">
          Free Date Night is free for 30 minutes — then $2.99 if the host extends. Dinner is $9.99 for 90 minutes after you sit. Movie Night is $14.99 for 2.5 hours. Pay with a card on Stripe. Premium is $24.99 for 3 hours covering both. We do not send you to PayPal, Venmo, or Cash App.
        </p>
        {checkoutError && (
          <p className="mt-4 text-sm text-[#E8A0B8]">Couldn’t open Stripe. Tap a pay button to try again.</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to="/date-night" className="btn btn-gold px-8 py-3 text-sm">
            Free Date Night
          </Link>
          <Link to="/restaurant" className="btn btn-outline px-8 py-3 text-sm">
            Dinner $9.99
          </Link>
          <Link to="/movie-night" className="btn btn-outline px-8 py-3 text-sm">
            Movie Night $14.99
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
        {PLANS.map((plan) => {
          const isPopular = plan.popular
          return (
            <div
              key={plan.id}
              className={`card p-7 flex flex-col relative
                ${isPopular ? 'lg:-mt-2 lg:mb-2 border-[#C9A962]/70' : ''}
              `}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A962] text-[#0F0A0D] text-xs tracking-[1.5px] font-medium px-5 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-[#F8F4ED] text-2xl">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-medium text-[#F8F4ED] tracking-tighter">{plan.price}</span>
                  <span className="text-sm text-[#A8988A] ml-1">/ {plan.period}</span>
                </div>
                <p className="text-[#A8988A] mt-3 text-sm leading-snug">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 text-[#C9A962]">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-[#EDE4D9]">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.id === 'free' ? (
                <Link to={plan.roomPath} className="btn btn-outline w-full py-3.5 text-sm">
                  {plan.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn w-full py-3.5 text-sm ${isPopular ? 'btn-gold' : 'btn-outline'}`}
                  disabled={busy === plan.id}
                  onClick={() => onPaidCta(plan)}
                >
                  {busy === plan.id ? 'Opening Stripe…' : plan.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="card p-8 mt-16 max-w-xl mx-auto">
        <h2 className="text-[#F8F4ED] text-2xl mb-2">Leave your email</h2>
        <p className="text-[#A8988A] text-sm mb-6">
          Want a note when we add more rooms? Leave your email.
        </p>
        <WaitlistForm intent="pricing-optional" submitLabel="Join the waitlist" />
      </div>

      <AnimatePresence>
        {waitlistPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setWaitlistPlan(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="absolute top-6 right-6 text-[#A8988A]" onClick={() => setWaitlistPlan(null)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
              <p className="text-[#A8988A] text-sm mb-4">
                Leave your email for {waitlistPlan.name} ({waitlistPlan.price}). We’ll follow up.
              </p>
              <WaitlistForm intent="paid-plan-waitlist" plan={`${waitlistPlan.id}:${waitlistPlan.name}`} submitLabel="Join the waitlist" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
