import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Clapperboard, MessageCircle, UtensilsCrossed } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { consumeChooserPaidReturn } from '../lib/roomAccess'

const rooms = [
  {
    to: '/restaurant',
    icon: UtensilsCrossed,
    kicker: '$9.99',
    length: 'for 90 minutes',
    title: 'Restaurant Date',
    desc: 'Walk in, sit down, order from The Verdant Ember and The Silver Sage at one table. 90 minutes after you sit. Live waiter clips. No movie player.',
  },
  {
    to: '/movie-night',
    icon: Clapperboard,
    kicker: '$14.99',
    length: 'for 2.5 hours',
    title: 'Movie Night',
    desc: 'Walk in past the booth and lobby. Paste YouTube, press Play. 2.5 hours. Chat floats while you watch. No restaurant menus.',
  },
  {
    to: '/date-night',
    icon: MessageCircle,
    kicker: 'Free',
    length: 'for 30 minutes',
    title: 'Free Date Night',
    desc: 'Simple together time. Chat only. Free for 30 minutes. The host can extend for $2.99. No menus, no movie player.',
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
    if (params.get('plan') === 'extend') return
    toastedPaid.current = true
    consumeChooserPaidReturn()
    toast.success('You’re in', {
      description: 'Dinner and movie night are unlocked in this browser. Pick a room.',
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
        <p className="mt-4 text-xl text-[#A8988A] max-w-2xl mx-auto space-y-3">
          <span className="block">Each room is its own page.</span>
          <span className="block">
            Restaurant is $9.99
            <br />
            for 90 minutes.
          </span>
          <span className="block">
            Movie Night is $14.99
            <br />
            for 2.5 hours.
          </span>
          <span className="block">Free Date Night is 30 minutes. No card to start.</span>
          <span className="block">Restaurant and movie night: pay with a card on Stripe before those rooms start.</span>
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Link key={room.to} to={room.to} className="card p-8 hover:border-[#C9A962]/50 transition group">
            <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-5 group-hover:bg-[#C9A962]/20">
              <room.icon className="w-6 h-6 text-[#C9A962]" />
            </div>
            <div className="text-[#E8A0B8] text-xs tracking-[2px] mb-2">
              <div>{room.kicker}</div>
              <div>{room.length}</div>
            </div>
            <h2 className="text-[#F8F4ED] text-2xl mb-3">{room.title}</h2>
            <p className="text-[#A8988A] leading-relaxed">{room.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
