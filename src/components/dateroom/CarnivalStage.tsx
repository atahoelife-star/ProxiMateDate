import { useEffect, useState } from 'react'
import {
  GAMES_STILL,
  HOLLOW_BEATS,
  MIDWAY_STILL,
  PARK_NAME,
  RIDES,
  type AttractionId,
  type RideId,
  rideById,
} from '../../data/carnival'
import { CarnivalGames } from './CarnivalGames'

type CarnivalStageProps = {
  onRoomMessage: (text: string) => void
}

export function CarnivalStage({ onRoomMessage }: CarnivalStageProps) {
  const [view, setView] = useState<AttractionId | 'map'>('map')

  const openRide = (id: RideId) => {
    const ride = rideById(id)
    setView(id)
    if (ride) onRoomMessage(ride.chatLine)
  }

  const openGames = () => {
    setView('games')
    onRoomMessage('You walk the games midway — ring toss, the bell, bottles, and darts.')
  }

  if (view === 'map') {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[520px]">
        <img src={MIDWAY_STILL} alt="" className="carnival-still absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/92 via-[#0F0A0D]/40 to-[#0F0A0D]/25" />
        <div className="relative z-10 p-5 md:p-8">
          <div className="text-[#C9A962] text-[11px] tracking-[3px]">TICKET PLAZA · MIDWAY</div>
          <h2 className="text-[#F8F4ED] text-3xl mt-2">{PARK_NAME}</h2>
          <p className="text-[#EDE4D9]/90 mt-3 max-w-xl leading-relaxed">
            Walk the lantern midway and pick a ride. Each attraction is original — no Disney, Universal, or Six Flags
            names, no pirate boats.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-7">
            {RIDES.map((ride) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => openRide(ride.id)}
                className="text-left rounded-2xl overflow-hidden border border-white/15 bg-[#0F0A0D]/60 hover:border-[#C9A962]/55"
              >
                <img src={ride.still} alt="" className="h-28 w-full object-cover" />
                <div className="p-4">
                  <div className="text-[#C9A962] text-[10px] tracking-[2px]">{ride.kicker.toUpperCase()}</div>
                  <div className="text-[#F8F4ED] font-medium mt-1">{ride.name}</div>
                  <p className="text-[#A8988A] text-sm mt-1 leading-relaxed">{ride.blurb}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={openGames}
              className="text-left rounded-2xl overflow-hidden border border-white/15 bg-[#0F0A0D]/60 hover:border-[#C9A962]/55 sm:col-span-2"
            >
              <img src={GAMES_STILL} alt="" className="h-28 w-full object-cover" />
              <div className="p-4">
                <div className="text-[#C9A962] text-[10px] tracking-[2px]">CARNIVAL GAMES</div>
                <div className="text-[#F8F4ED] font-medium mt-1">Midway booths</div>
                <p className="text-[#A8988A] text-sm mt-1 leading-relaxed">
                  Ring toss, ring the bell, bottle knock-down, and balloon darts. Playable moments, not empty posters.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'games') {
    return <CarnivalGames onBack={() => setView('map')} onNote={onRoomMessage} />
  }

  if (view === 'hollow') {
    return <FireflyHollow onBack={() => setView('map')} />
  }

  const ride = rideById(view)
  if (!ride) return null
  return <RideView key={ride.id} ride={ride} onBack={() => setView('map')} />
}

function RideView({
  ride,
  onBack,
}: {
  ride: NonNullable<ReturnType<typeof rideById>>
  onBack: () => void
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 80), 80)
    return () => window.clearInterval(id)
  }, [])

  const progress = Math.min(1, tick / ride.durationMs)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[520px]">
      <img src={ride.still} alt="" className="carnival-still absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/88 via-transparent to-[#0F0A0D]/30" />
      <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[520px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[#C9A962] text-[11px] tracking-[2px]">{ride.kicker.toUpperCase()}</div>
            <h2 className="text-[#F8F4ED] text-3xl mt-1">{ride.name}</h2>
          </div>
          <button type="button" onClick={onBack} className="btn btn-ghost text-sm px-4 py-2 border border-white/20">
            Midway
          </button>
        </div>
        <p className="text-[#EDE4D9] mt-6 max-w-xl leading-relaxed">{ride.blurb}</p>
        <div className="mt-auto pt-8">
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full bg-[#C9A962]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button type="button" onClick={onBack} className="btn btn-gold px-5 py-2 text-sm">
              Return to midway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FireflyHollow({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0)
  const beat = HOLLOW_BEATS[index] ?? HOLLOW_BEATS[0]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex((i) => (i < HOLLOW_BEATS.length - 1 ? i + 1 : i))
    }, beat.durationMs)
    return () => window.clearTimeout(timer)
  }, [beat.durationMs, index])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[520px]">
      <img key={beat.id} src={beat.src} alt="" className="carnival-still absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/90 via-[#0F0A0D]/20 to-[#0F0A0D]/35" />
      <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[520px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[#C9A962] text-[11px] tracking-[2px]">ANIMATRONIC DARK RIDE</div>
            <h2 className="text-[#F8F4ED] text-3xl mt-1">Firefly Hollow</h2>
            <p className="text-[#E8A0B8] text-sm mt-2">Cabin bears · fireflies · lanterns — not a pirate ride</p>
          </div>
          <button type="button" onClick={onBack} className="btn btn-ghost text-sm px-4 py-2 border border-white/20">
            Midway
          </button>
        </div>
        <div className="mt-8 max-w-xl">
          <div className="text-[#C9A962] text-xs tracking-[2px]">{beat.title.toUpperCase()}</div>
          <p className="text-[#F8F4ED] text-lg mt-2 leading-relaxed">{beat.line}</p>
        </div>
        <div className="mt-auto pt-8 flex flex-wrap items-center gap-3">
          {HOLLOW_BEATS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 w-8 rounded-full ${i === index ? 'bg-[#C9A962]' : 'bg-white/25'}`}
              aria-label={item.title}
            />
          ))}
          <button type="button" onClick={onBack} className="btn btn-gold ml-auto px-5 py-2 text-sm">
            Return to midway
          </button>
        </div>
      </div>
    </div>
  )
}
