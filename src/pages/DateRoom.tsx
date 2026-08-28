import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Clapperboard, MessageCircle, UtensilsCrossed } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const rooms = [
  {
    to: '/restaurant',
    icon: UtensilsCrossed,
    kicker: 'DINNER',
    title: 'Restaurant Date',
    desc: 'Walk in, sit down, order from The Verdant Ember and The Silver Sage at one table. Live waiter clips. No movie player.',
  },
  {
    to: '/movie-night',
    icon: Clapperboard,
    kicker: 'THEATER',
    title: 'Movie Night',
    desc: 'Walk in past the booth and lobby. Paste YouTube, press Play. Chat floats while you watch. No restaurant menus.',
  },
  {
    to: '/date-night',
    icon: MessageCircle,
    kicker: 'FREE',
    title: 'Free Date Night',
    desc: 'Simple together time. Chat only. No menus, no movie player.',
  },
]

export function DateRoomPage() {
  const [params] = useSearchParams()
  const watch = params.get('watch')
  const follow = params.get('follow') === '1'

  const toastedPaid = useRef(false)

  useEffect(() => {
    if (toastedPaid.current) return
    if (params.get('paid') !== '1' || watch || follow) return
    toastedPaid.current = true
    toast.success('Stripe Checkout completed', {
      description: 'Thank you. Pick a room below — nothing extra was unlocked.',
    })
    const next = new URLSearchParams(params)
    next.delete('paid')
    const qs = next.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }, [follow, params, watch])

  if (follow || (watch && watch !== 'open')) {
    return <Navigate to={`/movie-night?${params.toString()}`} replace />
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">PICK YOUR EVENING</div>
        <h1 className="text-[#F8F4ED]">Three date rooms</h1>
        <p className="mt-4 text-xl text-[#A8988A] max-w-2xl mx-auto">
          Each room is its own page. None of them are behind a paywall. Restaurant and movie night start with a short walk-in.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Link key={room.to} to={room.to} className="card p-8 hover:border-[#C9A962]/50 transition group">
            <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-5 group-hover:bg-[#C9A962]/20">
              <room.icon className="w-6 h-6 text-[#C9A962]" />
            </div>
            <div className="text-[#E8A0B8] text-xs tracking-[2px] mb-2">{room.kicker}</div>
            <h2 className="text-[#F8F4ED] text-2xl mb-3">{room.title}</h2>
            <p className="text-[#A8988A] leading-relaxed">{room.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
