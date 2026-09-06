import { useCallback, useEffect, useRef, useState } from 'react'
import { GAMES, PRIZE_STILL, type GameId, gameById } from '../../data/carnival'
import { PLAY_COST, TOKEN_PACK, TOKEN_PACK_PRICE } from '../../lib/carnivalTokens'

type CarnivalGamesProps = {
  onBack: () => void
  onNote: (text: string) => void
  tokens: number
  onSpend: (n: number) => boolean
  onBuy: () => void
  buying: boolean
  buyError: string
}

const BOTTLES = ['a', 'b', 'c', 'd', 'e', 'f']
const BALLOONS = [
  { id: 'blush', color: '#E8A0B8' },
  { id: 'cream', color: '#F8F4ED' },
  { id: 'gold', color: '#C9A962' },
  { id: 'sage', color: '#9BB59B' },
  { id: 'rose', color: '#D47A9A' },
]

function powerFromHold(ms: number) {
  const raw = ms / 1050
  if (raw <= 1) return Math.min(1, Math.max(0.05, raw))
  return Math.max(0.28, 1 - (raw - 1) * 1.35)
}

function inSweet(power: number, low = 0.52, high = 0.9) {
  return power >= low && power <= high
}

function useCharge(onRelease: (power: number) => void, disabled: boolean) {
  const [charging, setCharging] = useState(false)
  const [power, setPower] = useState(0)
  const start = useRef(0)
  const onReleaseRef = useRef(onRelease)

  useEffect(() => {
    onReleaseRef.current = onRelease
  }, [onRelease])

  const begin = useCallback(() => {
    if (disabled || charging) return
    start.current = performance.now()
    setCharging(true)
    setPower(0.08)
  }, [charging, disabled])

  const end = useCallback(() => {
    if (!charging) return
    const held = performance.now() - start.current
    const next = powerFromHold(held)
    setCharging(false)
    setPower(0)
    onReleaseRef.current(next)
  }, [charging])

  useEffect(() => {
    if (!charging) return
    const id = window.setInterval(() => {
      setPower(powerFromHold(performance.now() - start.current))
    }, 40)
    return () => window.clearInterval(id)
  }, [charging])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      event.preventDefault()
      begin()
    }
    const up = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      end()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [begin, end])

  return { charging, power, begin, end }
}

export function CarnivalGames({
  onBack,
  onNote,
  tokens,
  onSpend,
  onBuy,
  buying,
  buyError,
}: CarnivalGamesProps) {
  const [booth, setBooth] = useState<GameId | null>(null)
  const [needTokens, setNeedTokens] = useState(false)
  const game = booth ? gameById(booth) : null

  const openBooth = (id: GameId) => {
    if (tokens < PLAY_COST) {
      setNeedTokens(true)
      onNote('The booth wants two tokens.')
      return
    }
    if (!onSpend(PLAY_COST)) {
      setNeedTokens(true)
      return
    }
    setNeedTokens(false)
    setBooth(id)
    onNote(`Two tokens in. ${gameById(id)?.name}. Hold to cock, release to throw.`)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[560px]">
      <img
        src={game?.still || '/images/carnival/carnival-midway.jpg'}
        alt=""
        className="carnival-still absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/92 via-[#0F0A0D]/40 to-[#0F0A0D]/20" />
      <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[560px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[#C9A962] text-[11px] tracking-[2px]">MIDWAY GAMES · {tokens} TOKENS</div>
            <h2 className="text-[#F8F4ED] text-2xl mt-1">{game?.name || 'Buy tokens, then play'}</h2>
            <p className="text-[#EDE4D9]/90 text-sm mt-2 max-w-xl">
              {game?.blurb || `10 tokens for ${TOKEN_PACK_PRICE}. Each play costs ${PLAY_COST}. Hold Space or the big button, then release.`}
            </p>
          </div>
          <button type="button" onClick={onBack} className="btn btn-ghost text-sm px-4 py-2 border border-white/20 shrink-0">
            Midway
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-full border border-[#C9A962]/50 text-[#C9A962] text-xs tracking-widest">
            {tokens} TOKENS
          </div>
          <button type="button" onClick={onBuy} disabled={buying} className="btn btn-gold px-4 py-2 text-sm">
            {buying ? 'Opening Stripe…' : `Buy ${TOKEN_PACK} tokens — ${TOKEN_PACK_PRICE}`}
          </button>
        </div>
        {buyError && <p className="text-[#E8A0B8] text-sm mt-2">{buyError}</p>}
        {needTokens && tokens < PLAY_COST && (
          <p className="text-[#EDE4D9] text-sm mt-2">You need {PLAY_COST} tokens to start a booth.</p>
        )}

        {!booth ? (
          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {GAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openBooth(item.id)}
                className="text-left rounded-2xl border border-white/20 bg-[#0F0A0D]/55 hover:border-[#C9A962]/60 p-4"
              >
                <div className="text-[#F8F4ED] font-medium">{item.name}</div>
                <div className="text-[#A8988A] text-sm mt-1">{item.play}</div>
                <div className="text-[#C9A962] text-[11px] mt-2">{PLAY_COST} tokens</div>
              </button>
            ))}
          </div>
        ) : booth === 'ringtoss' ? (
          <RingToss onLeave={() => setBooth(null)} onNote={onNote} />
        ) : booth === 'strongman' ? (
          <Strongman onLeave={() => setBooth(null)} onNote={onNote} />
        ) : booth === 'bottles' ? (
          <BottleKnock onLeave={() => setBooth(null)} onNote={onNote} />
        ) : (
          <BalloonDarts onLeave={() => setBooth(null)} onNote={onNote} />
        )}
      </div>
    </div>
  )
}

function ChargeBar({ power, charging }: { power: number; charging: boolean }) {
  return (
    <div className="h-3 rounded-full bg-[#1A1418]/80 border border-white/15 overflow-hidden max-w-md">
      <div
        className={`h-full ${inSweet(power) && charging ? 'bg-[#C9A962]' : 'bg-[#E8A0B8]'}`}
        style={{ width: `${power * 100}%` }}
      />
    </div>
  )
}

function CockControl({
  charging,
  power,
  begin,
  end,
  label,
}: {
  charging: boolean
  power: number
  begin: () => void
  end: () => void
  label: string
}) {
  return (
    <div className="mt-4 max-w-md">
      <ChargeBar power={power} charging={charging} />
      <button
        type="button"
        className="btn btn-gold mt-4 w-full py-4 text-base"
        onPointerDown={(event) => {
          event.preventDefault()
          begin()
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={() => {
          if (charging) end()
        }}
      >
        {charging ? 'Cocked — release' : label}
      </button>
      <p className="text-[#A8988A] text-xs mt-2">Hold Space or this button. Longer hold adds power. Too long overshoots.</p>
    </div>
  )
}

function BalloonDarts({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [left, setLeft] = useState(5)
  const [hits, setHits] = useState(0)
  const [popped, setPopped] = useState<string[]>([])
  const [fly, setFly] = useState<{ hit: boolean; key: number } | null>(null)
  const [prize, setPrize] = useState(false)
  const [busy, setBusy] = useState(false)
  const aim = BALLOONS[Math.max(0, 5 - left)] ?? BALLOONS[0]

  const throwDart = (power: number) => {
    if (left <= 0 || busy) return
    const hit = inSweet(power) && !popped.includes(aim.id)
    const key = left
    setBusy(true)
    setFly({ hit, key })
    window.setTimeout(() => {
      const nextLeft = left - 1
      const nextHits = hits + (hit ? 1 : 0)
      setLeft(nextLeft)
      setHits(nextHits)
      if (hit) setPopped((prev) => [...prev, aim.id])
      if (nextHits >= 3 && !prize) {
        setPrize(true)
        onNote('Three balloons. A Pinewick lantern raccoon is yours.')
      } else {
        onNote(hit ? 'The dart flies and pops a balloon.' : 'The dart flies and slips past.')
      }
      setBusy(false)
    }, 640)
  }

  const { charging, power, begin, end } = useCharge(throwDart, left <= 0 || busy)

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Hold to cock a dart. Release to throw. Hit 3 of 5 for a prize.</p>
      <div className="relative mt-6 grid grid-cols-5 gap-3 max-w-lg">
        {BALLOONS.map((item) => (
          <div key={item.id} className="relative h-16">
            <span className={`carnival-balloon ${popped.includes(item.id) ? 'is-pop' : ''}`} style={{ background: item.color }} />
          </div>
        ))}
        {fly && <span className={`carnival-fly-dart ${fly.hit ? 'is-hit' : 'is-miss'}`} key={fly.key} />}
      </div>
      <div className="flex gap-3 mt-6" aria-label="Darts remaining">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`carnival-dart-icon ${i >= left ? 'is-spent' : charging && i === left - 1 ? 'is-cocked' : ''}`} />
        ))}
      </div>
      <CockControl charging={charging} power={power} begin={begin} end={end} label="Hold to cock dart" />
      {prize && (
        <div className="mt-5 flex items-center gap-4">
          <img src={PRIZE_STILL} alt="" className="w-20 h-20 rounded-2xl object-cover border border-[#C9A962]/50" />
          <p className="text-[#F8F4ED] text-sm">Prize: a lantern raccoon from Pinewick Fair.</p>
        </div>
      )}
      <div className="mt-auto pt-6">
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function RingToss({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [left, setLeft] = useState(3)
  const [ringed, setRinged] = useState<string[]>([])
  const [fly, setFly] = useState<{ target: string; hit: boolean; key: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const target = BOTTLES.find((id) => !ringed.includes(id)) ?? BOTTLES[0]

  const toss = (power: number) => {
    if (left <= 0 || busy) return
    const hit = inSweet(power) && !ringed.includes(target)
    setBusy(true)
    setFly({ target, hit, key: left })
    window.setTimeout(() => {
      setLeft((n) => n - 1)
      if (hit) setRinged((prev) => [...prev, target])
      onNote(hit ? 'The ring flies and seats.' : 'The ring flies off the neck.')
      setBusy(false)
    }, 720)
  }

  const { charging, power, begin, end } = useCharge(toss, left <= 0 || busy)

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Hold to cock the ring. Release to throw.</p>
      <div className="relative mt-6 grid grid-cols-3 gap-5 max-w-md mx-auto min-h-[200px]">
        {BOTTLES.map((id) => (
          <div key={id} className="relative h-28 flex flex-col items-center justify-end">
            <div className={`carnival-bottle ${ringed.includes(id) ? 'carnival-bottle-ringed' : ''}`}>
              <div className="carnival-bottle-neck" />
              <div className="carnival-bottle-body" />
              {ringed.includes(id) && <span className="carnival-ring-seated" />}
            </div>
            {fly?.target === id && <span className={`carnival-fly-ring ${fly.hit ? 'is-hit' : 'is-miss'}`} />}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`carnival-ring-icon ${i >= left ? 'is-spent' : charging && i === left - 1 ? 'is-cocked' : ''}`} />
        ))}
      </div>
      <CockControl charging={charging} power={power} begin={begin} end={end} label="Hold to cock ring" />
      <div className="mt-auto pt-6">
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function Strongman({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [used, setUsed] = useState(false)
  const [height, setHeight] = useState(0)
  const [bell, setBell] = useState(false)

  const strike = (power: number) => {
    if (used) return
    setUsed(true)
    setHeight(Math.round(power * 100))
    const rang = inSweet(power, 0.78, 1)
    setBell(rang)
    onNote(rang ? 'The mallet hits. The puck rings the bell.' : 'The mallet hits. The puck climbs and falls short.')
  }

  const { charging, power, begin, end } = useCharge(strike, used)

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Hold to charge the mallet. Release to swing. High and true rings the bell.</p>
      <div className="mt-5 flex items-end gap-8">
        <div className="carnival-striker">
          <div className={`carnival-bell ${bell ? 'is-ring' : ''}`} />
          <div className="carnival-tower">
            <div className="carnival-puck" style={{ bottom: `${Math.max(8, used ? height : power * 100)}%` }} />
          </div>
          <div className={`carnival-mallet ${used ? 'is-swing' : charging ? 'is-cocked' : ''}`} />
        </div>
        <CockControl charging={charging} power={power} begin={begin} end={end} label="Hold to charge mallet" />
      </div>
      <div className="mt-auto pt-6">
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function BottleKnock({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [left, setLeft] = useState(3)
  const [down, setDown] = useState<string[]>([])
  const [fly, setFly] = useState<{ target: string; key: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const target = BOTTLES.find((id) => !down.includes(id)) ?? BOTTLES[0]

  const throwBall = (power: number) => {
    if (left <= 0 || busy) return
    const hit = inSweet(power, 0.45, 0.95)
    setBusy(true)
    setFly({ target, key: left })
    window.setTimeout(() => {
      setLeft((n) => n - 1)
      if (hit) {
        const extra = power > 0.8 ? BOTTLES.find((id) => id !== target && !down.includes(id)) : null
        setDown((prev) => (extra ? [...prev, target, extra] : [...prev, target]))
        onNote(extra ? 'The ball flies. Two bottles tip.' : 'The ball flies. A bottle tips.')
      } else {
        onNote('The ball flies wide.')
      }
      setBusy(false)
    }, 620)
  }

  const { charging, power, begin, end } = useCharge(throwBall, left <= 0 || busy)
  const rows = [BOTTLES.slice(0, 2), BOTTLES.slice(2)]

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Hold to cock the ball. Release to throw.</p>
      <div className="relative mt-8 flex flex-col items-center gap-3 min-h-[200px]">
        {rows.map((row) => (
          <div key={row[0]} className="flex gap-4">
            {row.map((id) => (
              <div key={id} className="relative h-24 w-16">
                <div className={`carnival-milk ${down.includes(id) ? 'is-down' : ''}`} />
                {fly?.target === id && <span className="carnival-fly-ball" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`carnival-ball-icon ${i >= left ? 'is-spent' : charging && i === left - 1 ? 'is-cocked' : ''}`} />
        ))}
      </div>
      <CockControl charging={charging} power={power} begin={begin} end={end} label="Hold to cock ball" />
      <div className="mt-auto pt-6">
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}
