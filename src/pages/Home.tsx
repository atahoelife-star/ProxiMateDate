import { Link } from 'react-router-dom'
import { Clapperboard, FerrisWheel, Heart, MessageCircle, UtensilsCrossed } from 'lucide-react'
import { LandingDemo, LandingDemoCtas } from '../components/LandingDemo'
import { FallLeaves } from '../components/FallLeaves'
import { FIRST_DATE_PRICE, LIST_DURATION, LIST_PRICE } from '../data/prices'

const looks = [
  {
    to: '/restaurant',
    src: '/images/arrival/restaurant/sit-down.jpg',
    kicker: 'Dinner',
    title: 'A table, two kitchens',
    desc: 'Walk in, sit down, order from two restaurants at one table. Vegan on one side, steak on the other.',
  },
  {
    to: '/movie-night',
    src: '/images/arrival/cinema/popcorn.jpg',
    kicker: 'Movie night',
    title: 'Popcorn, then Play',
    desc: 'Ticket booth, lobby, and a warm bucket of popcorn. Paste YouTube and watch together.',
  },
  {
    to: '/date-night',
    src: '/images/candlelit-table.jpg',
    kicker: 'Just talk',
    title: 'Thirty quiet minutes',
    desc: 'No menus. No movie. A simple room to be in the same evening. Free to start.',
  },
]

const rooms = [
  {
    to: '/restaurant',
    icon: UtensilsCrossed,
    title: 'Restaurant Date',
    desc: 'Walk in past the host, find your table, sit down. Dual menus and a live dining room.',
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
    desc: 'Simple together time. Just chat. No card to start.',
  },
]

const evenings = [
  { name: 'Dinner', price: LIST_PRICE.dinner, duration: LIST_DURATION.dinner },
  { name: 'Movie night', price: LIST_PRICE.movie, duration: LIST_DURATION.movie },
  { name: 'Both', price: LIST_PRICE.premium, duration: `${LIST_DURATION.premium} covering both` },
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

          <h1 className="text-[#F8F4ED] mb-4 leading-none">
            Stay close,
            <br />
            even when far apart
          </h1>

          <p className="max-w-xl mx-auto text-lg text-[#EDE4D9]/90 mb-8">
            Dinner across a table. A movie on the couch. Or just talk. Walk through the rooms first — no
            sign-in.
          </p>

          <LandingDemo className="max-w-4xl mx-auto mb-8" />

          <LandingDemoCtas kind="try" />

          <p className="mt-6 text-sm text-[#A8988A]">
            Free Date Night is 30 minutes. No card to start.
          </p>
        </div>
      </div>

      <div id="how-it-works" className="max-w-6xl mx-auto px-6 pt-6 pb-16 scroll-mt-24">
        <div className="text-center mb-12">
          <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">WHAT IT’S LIKE</div>
          <h2 className="text-[#F8F4ED]">Look around before you pay</h2>
          <p className="max-w-2xl mx-auto mt-4 text-[#A8988A] leading-relaxed">
            Open a room and walk in. The restaurant has two kitchens at one table. Movie night has
            popcorn and a couch. Or start talking for free.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {looks.map((look) => (
            <Link
              key={look.to}
              to={look.to}
              className="group overflow-hidden rounded-2xl border border-[#3A2F36] bg-[#1A1418] hover:border-[#C9A962]/50 transition"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={look.src}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                />
              </div>
              <div className="p-6 text-left">
                <div className="text-[#C9A962] text-[11px] tracking-[2px]">{look.kicker.toUpperCase()}</div>
                <h3 className="text-[#F8F4ED] text-xl mt-2">{look.title}</h3>
                <p className="text-[#A8988A] text-sm mt-2 leading-relaxed">{look.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-14">
          <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">THE ROOMS</div>
          <h2 className="text-[#F8F4ED]">Three ways to spend the evening</h2>
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

        <div className="card mt-6 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[#C9A962]/10 flex items-center justify-center shrink-0">
            <FerrisWheel className="w-7 h-7 text-[#C9A962]" />
          </div>
          <div className="text-left">
            <div className="text-[#C9A962] text-xs tracking-[2px] mb-2">COMING SOON</div>
            <h3 className="text-[#F8F4ED] text-xl mb-2">Pinewick Fair</h3>
            <p className="text-[#A8988A] leading-relaxed">
              An original carnival date room. Lanterns, timber, a country midway. Not for sale yet.
            </p>
          </div>
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
            This site is for couples who are away from each other and still want an evening together.
            If you miss dinner across a table — vegan on one side, steak on the other — the restaurant
            room is for you. Movie night is Watch Together. Free date night is just talking for a
            little while.
          </p>
          <p className="text-[#A8988A] mt-6 leading-relaxed">
            Orders stay with you; they do not go to a kitchen. YouTube uses Google’s official player.
            Netflix stays on your own apps.
          </p>
        </div>
      </div>

      <div id="when-youre-ready" className="max-w-3xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="text-center mb-8">
          <div className="text-[#7A6B5F] text-xs tracking-[3px] mb-3">WHEN YOU’RE READY</div>
          <h2 className="text-[#EDE4D9] text-2xl">An evening, if you want one</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {evenings.map((item) => (
            <div key={item.name} className="rounded-2xl border border-[#3A2F36]/80 bg-[#1A1418]/50 px-4 py-5 text-center">
              <div className="text-[#7A6B5F] text-xs tracking-[1px]">{item.name}</div>
              <div className="text-[#EDE4D9] text-lg mt-1.5">{item.price}</div>
              <div className="text-[#7A6B5F] text-[11px] mt-1.5 leading-relaxed">{item.duration}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#7A6B5F] mt-6 leading-relaxed">
          First paid evening is half off — dinner {FIRST_DATE_PRICE.dinner}, movie {FIRST_DATE_PRICE.movie},
          both {FIRST_DATE_PRICE.premium}. After that, list price. Free Date Night stays free.
        </p>
        <div className="text-center mt-4">
          <Link to="/pricing" className="text-[#A8988A] text-sm underline underline-offset-2 hover:text-[#C9A962]">
            Full pricing
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#1A1418] border-t border-[#3A2F36] py-16">
        <FallLeaves variant="scatter" />
        <div className="relative z-10 max-w-xl mx-auto text-center px-6">
          <Heart className="w-9 h-9 text-[#E8A0B8] mx-auto mb-6" />
          <h2 className="text-[#F8F4ED] mb-4">Your next date night is waiting.</h2>
          <p className="text-lg text-[#A8988A] mb-8">
            Start with Free Date Night. Dinner and a movie are here when you want them.
          </p>
          <LandingDemoCtas size="md" kind="try" />
        </div>
      </div>
    </div>
  )
}
