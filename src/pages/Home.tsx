import { Link } from 'react-router-dom'
import { ArrowRight, Clapperboard, Heart, MessageCircle, UtensilsCrossed } from 'lucide-react'

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
    desc: 'Simple together time. Just chat. No menus, no movie player.',
  },
]

export function HomePage() {
  return (
    <div>
      <div className="relative h-[92vh] min-h-[620px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero.jpg"
            alt="Romantic couple connecting across distance"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A0D]/70 via-[#0F0A0D]/75 to-[#0F0A0D]" />
        </div>

        <div className="relative z-10 max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#C9A962]/30 bg-white/5 text-sm mb-6">
            <Heart className="w-4 h-4 text-[#E8A0B8]" /> A long-distance date night, in the browser
          </div>

          <h1 className="text-[#F8F4ED] mb-6 leading-none">
            Stay close,
            <br />
            even when far apart
          </h1>

          <p className="max-w-xl mx-auto text-xl text-[#EDE4D9]/90 mb-10">
            Three rooms: restaurant dinner ($9.99), movie night ($14.99), and a simple free date night.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/restaurant" className="btn btn-gold text-base px-10 py-4 group">
              Restaurant Date
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link to="/movie-night" className="btn btn-outline text-base px-10 py-4">
              Movie Night
            </Link>
            <Link to="/date-night" className="btn btn-outline text-base px-10 py-4">
              Free Date Night
            </Link>
          </div>

          <div className="mt-8 text-xs tracking-[2px] text-[#A8988A]">NO ACCOUNT YET • EMAIL WAITLIST ONLY • NO CARD NUMBERS</div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-xs text-[#A8988A]">
          SCROLL TO DISCOVER <ArrowRight className="w-3 h-3 rotate-90 mt-1" />
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
            ProxiMateDate is a product in progress from A Tahoe Life / Gregory Barrett. We are not claiming a crowd of couples, and we are not quoting people who did not write in. If you miss dinner across a table — vegan on one side, steak on the other — the restaurant room is for you. Movie night is Watch Together. Free date night is just talking.
          </p>
          <p className="text-[#A8988A] mt-6 leading-relaxed">
            Orders do not go to a kitchen. YouTube uses Google’s official player. Netflix stays on your own apps. When real accounts exist, we’ll say so on the Privacy page.
          </p>
        </div>
      </div>

      <div className="bg-[#1A1418] border-t border-[#3A2F36] py-16">
        <div className="max-w-xl mx-auto text-center px-6">
          <Heart className="w-9 h-9 text-[#E8A0B8] mx-auto mb-6" />
          <h2 className="text-[#F8F4ED] mb-4">Your next date night is waiting.</h2>
          <p className="text-lg text-[#A8988A] mb-8">Try free date night, or pay for dinner or movie night with a card on Stripe Checkout — never a card form on this site.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pricing" className="btn btn-rose text-base px-10 py-4">
              See pricing
            </Link>
            <Link to="/get-started" className="btn btn-outline text-base px-10 py-4">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
