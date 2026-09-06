import { useState } from 'react'
import {
  GAMES_STILL,
  MIDWAY_STILL,
  PARK_NAME,
  RIDES,
  type AttractionId,
  type RideId,
} from '../../data/carnival'
import { PLAY_COST, TOKEN_PACK, TOKEN_PACK_PRICE, useCarnivalTokens } from '../../lib/carnivalTokens'
import { startStripeCheckout } from '../../lib/stripeCheckout'
import { CarnivalGames } from './CarnivalGames'
import { CarnivalRide } from './CarnivalRide'

type CarnivalStageProps = {
  onRoomMessage: (text: string) => void
}

export function CarnivalStage({ onRoomMessage }: CarnivalStageProps) {
  const [view, setView] = useState<AttractionId | 'map'>('map')
  const { tokens, spend, grantPack } = useCarnivalTokens()
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState('')

  const openRide = (id: RideId) => setView(id)
  const back = () => setView('map')

  const buyTokens = async () => {
    setBuying(true)
    setBuyError('')
    const qs = typeof window !== 'undefined' ? window.location.search : '?paid=1'
    const result = await startStripeCheckout('tokens', {
      returnTo: `/carnival${qs}`,
      cancelTo: `/carnival${qs}`,
    })
    setBuying(false)
    if (result === 'redirected') return
    if (result === 'waitlist') {
      grantPack()
      setBuyError(`Stripe is not configured on this preview. Added ${TOKEN_PACK} tokens so you can play.`)
      onRoomMessage(`Preview tokens: ${TOKEN_PACK} added.`)
      return
    }
    grantPack()
    setBuyError(`Checkout did not open. Added ${TOKEN_PACK} preview tokens.`)
    onRoomMessage(`Preview tokens: ${TOKEN_PACK} added.`)
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
            Rides are free on this preview. Games take tokens — {TOKEN_PACK} for {TOKEN_PACK_PRICE}, {PLAY_COST} per
            play. Crowds and lines stay. Original park. No Disney names, no pirate boats.
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
              onClick={() => {
                setView('games')
                onRoomMessage(`Games midway. ${tokens} tokens. Hold to cock, release to throw.`)
              }}
              className="text-left rounded-2xl overflow-hidden border border-white/15 bg-[#0F0A0D]/60 hover:border-[#C9A962]/55 sm:col-span-2"
            >
              <img src={GAMES_STILL} alt="" className="h-28 w-full object-cover" />
              <div className="p-4">
                <div className="text-[#C9A962] text-[10px] tracking-[2px]">CARNIVAL GAMES · {tokens} TOKENS</div>
                <div className="text-[#F8F4ED] font-medium mt-1">Midway booths</div>
                <p className="text-[#A8988A] text-sm mt-1 leading-relaxed">
                  Buy tokens, then play. Hold to cock. Release to throw. 3 of 5 balloons wins a prize.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'games') {
    return (
      <CarnivalGames
        onBack={back}
        onNote={onRoomMessage}
        tokens={tokens}
        onSpend={spend}
        onBuy={() => {
          void buyTokens()
        }}
        buying={buying}
        buyError={buyError}
      />
    )
  }

  return <CarnivalRide rideId={view} onBack={back} onNote={onRoomMessage} />
}
