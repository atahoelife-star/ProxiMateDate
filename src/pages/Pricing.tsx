import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PLANS } from '../data/plans'
import { WaitlistForm } from '../components/WaitlistForm'

export function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-6">
        <div className="text-[#C9A962] tracking-[3px] text-sm mb-3">NO PAYWALL</div>
        <h1 className="text-[#F8F4ED]">The date night is open</h1>
        <p className="mt-4 text-xl text-[#A8988A] max-w-xl mx-auto">
          Date Room, both restaurant menus, waiter videos, and Watch Together are unlocked. There is no Stripe Checkout and nothing is gated on payment.
        </p>
        <Link to="/date-room" className="btn btn-gold mt-8 px-10 py-4 text-base inline-flex">
          Enter the Date Room
        </Link>
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
                  START HERE
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
              <Link
                to={plan.id === 'movie' ? '/date-room?watch=open' : '/date-room'}
                className={`btn w-full py-3.5 text-sm ${isPopular ? 'btn-gold' : 'btn-outline'}`}
              >
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>

      <div className="card p-8 mt-16 max-w-xl mx-auto">
        <h2 className="text-[#F8F4ED] text-2xl mb-2">Optional: email for later</h2>
        <p className="text-[#A8988A] text-sm mb-6">
          If we add paid dates someday, we will not lock this preview behind them. Leave an email only if you want a note. No card.
        </p>
        <WaitlistForm intent="pricing-optional" submitLabel="Notify me later" />
      </div>
    </div>
  )
}
