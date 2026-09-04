import { Link } from 'react-router-dom'
import { Clapperboard, Heart, MessageCircle, UtensilsCrossed } from 'lucide-react'
import { LandingDemo, LandingDemoCtas } from '../components/LandingDemo'
import { FallLeaves } from '../components/FallLeaves'
import { FIRST_DATE_PRICE, LIST_PRICE } from '../data/prices'

const rooms = [
  {
    to: '/restaurant',
    icon: UtensilsCrossed,
    title: 'Restaurant Date',
    desc: 'Walk in past the host, find your table, sit down. Dual menus and a live 1x dining room.',
  },
  {
    to: '/movie-night',
    icon: Clapperboard,
    title: 'Movie Night',
    desc: 'Ticket booth, lobby, popcorn, seats. Then paste YouTube and press Play.',
  },
  {
    to: '/date-night',
    icon: MessageCircle,
    title: 'Free Date Night',
    desc: 'Simple together time. Just chat. Free for 30 minutes.',
  },
]

export function HomePage() {
  return (
    <div>
      <div className="relative pt-12 pb-16 md:pt-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A1810] via-[#0F0A0D] to-[#0F0A0D]" />
        <FallLeaves />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#C9A962]/30 bg-white/5 text-sm mb-5">
            <Heart className="w-4 h-4 text-[#E8A0B8]" /> A long-distance date night, in the browser
          </div>

          <div className="max-w-xl mx-auto mb-6 rounded-2xl border border-[#C9A962]/45 bg-[#C9A962]/10 px-5 py-4">
            <div className="text-[#C9A962] text-xs tracking-[2px] mb-1">FIRST DATE</div>
            <p className="text-[#F8F4ED] text-xl leading-snug">50% off your first paid evening</p>
            <p className="text-[#EDE4D9]/90 text-sm mt-2 leading-relaxed">
              Dinner {FIRST_DATE_PRICE.dinner}
              <br />
              Movie {FIRST_DATE_PRICE.movie}
              <br />
              Both {FIRST_DATE_PRICE.premium}
            </p>
            <p className="text-[#A8988A] text-xs mt-2">
              After that, list prices. Free date night stays free.
            </p>
          </div>

          <h1 className="text-[#F8F4ED] mb-4 leading-none">
            Stay close,
            <br />
            even when far apart
          </h1>

          <p className="max-w-xl mx-auto text-lg text-[#EDE4D9]/90 mb-8">
            A look at dinner and movie night. No sign-in. Loops while you watch.
          </p>

          <LandingDemo className="max-w-4xl mx-auto mb-8" />

          <LandingDemoCtas />

          <div className="max-w-md mx-auto text-lg text-[#EDE4D9]/90 mt-10 space-y-3">
            <p>Three rooms.</p>
            <p>
              Restaurant dinner is {LIST_PRICE.dinner}
              <br />
              for 90 minutes.
            </p>
            <p>
              Movie night is {LIST_PRICE.movie}
              <br />
              for 2.5 hours.
            </p>
            <p>
              Premium is {LIST_PRICE.premium}
              <br />
              for 3 hours covering both.
            </p>
            <p>Free date night is 30 minutes.</p>
          </div>

          <div className="mt-8 text-xs tracking-[2px] text-[#A8988A]">PAY WITH A CARD ON STRIPE</div>
        </div>
      </div>

      <div id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-24">
        <div className="text-center mb-14">
          <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">THREE ROOMS</div>
          <h2 className="text-[#F8F4ED]">Pick the evening you want</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Link key={room.to} to={room.to} className="card p-8 text-center group hover:border-[#C9A962]/50 transition">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-6 group-hover:bg-[#C9A962]/20 transition">
                <room.icon className="w-7 h-7 text-[#C9A962]" />
              </div>
              <h3 className="text-[#F8F4ED] text-xl mb-4">{room.title}</h3>
              <p className="text-[#A8988A] leading-relaxed">{room.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="section-divider max-w-6xl mx-auto" />

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-[#E8A0B8] text-sm tracking-[3px] mb-3">WHY THIS EXISTS</div>
          <h2 className="text-[#F8F4ED]">Built for the miles between you</h2>
        </div>
        <div className="card p-8 md:p-12">
          <p className="text-[#EDE4D9] leading-relaxed text-lg">
            This site is for couples who are away from each other and still want an evening together. If you miss dinner across a table — vegan on one side, steak on the other — the restaurant room is for you. Movie night is Watch Together. Free date night is just talking for a little while.
          </p>
          <p className="text-[#A8988A] mt-6 leading-relaxed">
            Orders stay with you; they do not go to a kitchen. YouTube uses Google’s official player. Netflix stays on your own apps. Dinner and movie night are paid with a card on Stripe.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#1A1418] border-t border-[#3A2F36] py-16">
        <FallLeaves variant="scatter" />
        <div className="relative z-10 max-w-xl mx-auto text-center px-6">
          <Heart className="w-9 h-9 text-[#E8A0B8] mx-auto mb-6" />
          <h2 className="text-[#F8F4ED] mb-4">Your next date night is waiting.</h2>
          <p className="text-lg text-[#A8988A] mb-3">
            First paid date is 50% off. Free date night is still free for 30 minutes.
          </p>
          <p className="text-lg text-[#A8988A] mb-8">Or pay list price for dinner or movie night with a card on Stripe.</p>
          <LandingDemoCtas size="md" />
        </div>
      </div>
    </div>
  )
}
