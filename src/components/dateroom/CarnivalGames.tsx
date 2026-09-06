import { useEffect, useRef, useState } from 'react'
import { GAMES, type GameId, gameById } from '../../data/carnival'

type CarnivalGamesProps = {
  onBack: () => void
  onNote: (text: string) => void
}

const BOTTLES = [
  { id: 'a', label: '1' },
  { id: 'b', label: '2' },
  { id: 'c', label: '3' },
  { id: 'd', label: '4' },
  { id: 'e', label: '5' },
  { id: 'f', label: '6' },
]

const BALLOONS = [
  { id: 'blush', color: '#E8A0B8' },
  { id: 'cream', color: '#F8F4ED' },
  { id: 'gold', color: '#C9A962' },
  { id: 'sage', color: '#9BB59B' },
  { id: 'rose', color: '#D47A9A' },
  { id: 'amber', color: '#D4A04A' },
  { id: 'ivory', color: '#EDE4D9' },
  { id: 'moss', color: '#6F8F6A' },
  { id: 'peach', color: '#E8C4A8' },
  { id: 'honey', color: '#C9A962' },
  { id: 'dust', color: '#C4B6A8' },
  { id: 'pine', color: '#7A9A74' },
]

function useChance() {
  const seed = useRef(0x9e3779b9)
  return (p: number) => {
    seed.current = (Math.imul(seed.current, 1664525) + 1013904223) >>> 0
    return seed.current / 0xffffffff < p
  }
}

export function CarnivalGames({ onBack, onNote }: CarnivalGamesProps) {
  const [booth, setBooth] = useState<GameId | null>(null)
  const game = booth ? gameById(booth) : null

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
            <div className="text-[#C9A962] text-[11px] tracking-[2px]">MIDWAY GAMES</div>
            <h2 className="text-[#F8F4ED] text-2xl mt-1">{game?.name || 'Pick a booth'}</h2>
            <p className="text-[#EDE4D9]/90 text-sm mt-2 max-w-xl">
              {game?.blurb || 'Ring toss, the bell, bottles, and darts — you see the throw, not a caption.'}
            </p>
          </div>
          <button type="button" onClick={onBack} className="btn btn-ghost text-sm px-4 py-2 border border-white/20 shrink-0">
            Midway
          </button>
        </div>

        {!booth ? (
          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {GAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setBooth(item.id)
                  onNote(`You step up to ${item.name}.`)
                }}
                className="text-left rounded-2xl border border-white/20 bg-[#0F0A0D]/55 hover:border-[#C9A962]/60 p-4"
              >
                <div className="text-[#F8F4ED] font-medium">{item.name}</div>
                <div className="text-[#A8988A] text-sm mt-1">{item.play}</div>
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

function RingToss({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [rings, setRings] = useState(3)
  const [ringed, setRinged] = useState<string[]>([])
  const [fly, setFly] = useState<{ target: string; hit: boolean; key: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const chance = useChance()

  const toss = (id: string) => {
    if (rings <= 0 || ringed.includes(id) || busy) return
    const hit = chance(0.62)
    const key = rings
    setBusy(true)
    setFly({ target: id, hit, key })
    window.setTimeout(() => {
      setRings((n) => n - 1)
      if (hit) {
        setRinged((prev) => [...prev, id])
        onNote('The ring flies and seats on the bottle.')
      } else {
        onNote('The ring flies past the neck.')
      }
      setBusy(false)
    }, 720)
  }

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Click a bottle. Watch the ring fly. {rings} left.</p>
      <div className="relative mt-6 grid grid-cols-3 gap-5 max-w-md mx-auto min-h-[220px]">
        {BOTTLES.map((bottle) => (
          <button
            key={bottle.id}
            type="button"
            disabled={rings <= 0 || busy}
            onClick={() => toss(bottle.id)}
            className="relative h-28 flex flex-col items-center justify-end"
          >
            <div className={`carnival-bottle ${ringed.includes(bottle.id) ? 'carnival-bottle-ringed' : ''}`}>
              <div className="carnival-bottle-neck" />
              <div className="carnival-bottle-body">{bottle.label}</div>
              {ringed.includes(bottle.id) && <span className="carnival-ring-seated" />}
            </div>
            {fly?.target === bottle.id && (
              <span className={`carnival-fly-ring ${fly.hit ? 'is-hit' : 'is-miss'}`} key={fly.key} />
            )}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setRings(3)
            setRinged([])
            setFly(null)
          }}
          className="btn btn-gold px-5 py-2 text-sm"
        >
          Play again
        </button>
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function Strongman({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [power, setPower] = useState(12)
  const [struck, setStruck] = useState(false)
  const [height, setHeight] = useState(0)
  const [bell, setBell] = useState(false)

  useEffect(() => {
    if (struck) return
    const id = window.setInterval(() => {
      setPower((p) => (p + 4 > 100 ? 8 : p + 4))
    }, 70)
    return () => window.clearInterval(id)
  }, [struck])

  const strike = () => {
    if (struck) return
    setStruck(true)
    const climb = power
    setHeight(climb)
    const rang = climb >= 86
    setBell(rang)
    onNote(rang ? 'The mallet hits. The puck rings the bell.' : 'The mallet hits. The puck climbs and falls short.')
  }

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">The meter climbs. Strike — the mallet and puck move.</p>
      <div className="mt-5 flex items-end gap-8">
        <div className="carnival-striker">
          <div className={`carnival-bell ${bell ? 'is-ring' : ''}`} />
          <div className="carnival-tower">
            <div className="carnival-puck" style={{ bottom: `${Math.max(8, height)}%` }} />
          </div>
          <div className={`carnival-mallet ${struck ? 'is-swing' : ''}`} />
        </div>
        <div className="flex-1 max-w-xs">
          <div className="h-3 rounded-full bg-[#1A1418]/80 border border-white/15 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E8A0B8] to-[#C9A962]" style={{ width: `${power}%` }} />
          </div>
          <button type="button" onClick={strike} disabled={struck} className="btn btn-gold mt-4 px-8 py-3">
            Strike
          </button>
        </div>
      </div>
      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setStruck(false)
            setPower(12)
            setHeight(0)
            setBell(false)
          }}
          className="btn btn-gold px-5 py-2 text-sm"
        >
          Play again
        </button>
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function BottleKnock({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [balls, setBalls] = useState(3)
  const [down, setDown] = useState<string[]>([])
  const [fly, setFly] = useState<{ target: string; key: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const chance = useChance()

  const throwBall = (id: string) => {
    if (balls <= 0 || down.includes(id) || busy) return
    const extra = chance(0.35) ? BOTTLES.find((b) => b.id !== id && !down.includes(b.id)) : null
    const fell = extra ? [id, extra.id] : [id]
    const key = balls
    setBusy(true)
    setFly({ target: id, key })
    window.setTimeout(() => {
      setBalls((n) => n - 1)
      setDown((prev) => [...prev, ...fell])
      onNote(fell.length > 1 ? 'The ball flies. Two bottles tip.' : 'The ball flies. A bottle tips.')
      setBusy(false)
    }, 620)
  }

  const rows = [BOTTLES.slice(0, 2), BOTTLES.slice(2)]

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Click a bottle. The ball flies. {balls} left.</p>
      <div className="relative mt-8 flex flex-col items-center gap-3 min-h-[200px]">
        {rows.map((row) => (
          <div key={row[0].id} className="flex gap-4">
            {row.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={balls <= 0 || busy || down.includes(b.id)}
                onClick={() => throwBall(b.id)}
                className="relative h-24 w-16"
              >
                <div className={`carnival-milk ${down.includes(b.id) ? 'is-down' : ''}`}>
                  <span>{b.label}</span>
                </div>
                {fly?.target === b.id && <span className="carnival-fly-ball" key={fly.key} />}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setBalls(3)
            setDown([])
            setFly(null)
          }}
          className="btn btn-gold px-5 py-2 text-sm"
        >
          Play again
        </button>
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function BalloonDarts({ onLeave, onNote }: { onLeave: () => void; onNote: (text: string) => void }) {
  const [darts, setDarts] = useState(5)
  const [popped, setPopped] = useState<string[]>([])
  const [fly, setFly] = useState<{ target: string; hit: boolean; key: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const chance = useChance()

  const throwDart = (id: string) => {
    if (darts <= 0 || popped.includes(id) || busy) return
    const hit = chance(0.78)
    const key = darts
    setBusy(true)
    setFly({ target: id, hit, key })
    window.setTimeout(() => {
      setDarts((n) => n - 1)
      if (hit) {
        setPopped((prev) => [...prev, id])
        onNote('The dart flies and the balloon pops.')
      } else {
        onNote('The dart flies between the balloons.')
      }
      setBusy(false)
    }, 640)
  }

  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">Click a balloon. Watch the dart. {darts} left.</p>
      <div className="relative mt-6 grid grid-cols-4 gap-3 max-w-md">
        {BALLOONS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={darts <= 0 || busy || popped.includes(item.id)}
            onClick={() => throwDart(item.id)}
            className="relative h-16"
          >
            <span
              className={`carnival-balloon ${popped.includes(item.id) ? 'is-pop' : ''}`}
              style={{ background: item.color }}
            />
            {fly?.target === item.id && (
              <span className={`carnival-fly-dart ${fly.hit ? 'is-hit' : 'is-miss'}`} key={fly.key} />
            )}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setDarts(5)
            setPopped([])
            setFly(null)
          }}
          className="btn btn-gold px-5 py-2 text-sm"
        >
          Play again
        </button>
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}
