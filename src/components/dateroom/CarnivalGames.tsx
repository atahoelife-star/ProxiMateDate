import { useEffect, useRef, useState, type ReactNode } from 'react'
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

const BALLOONS = ['blush', 'cream', 'gold', 'sage', 'rose', 'amber', 'ivory', 'moss', 'peach', 'honey', 'dust', 'pine']

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
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[520px]">
      <img
        src={game?.still || '/images/carnival/carnival-midway.jpg'}
        alt=""
        className="carnival-still absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/90 via-[#0F0A0D]/35 to-[#0F0A0D]/20" />
      <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[520px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[#C9A962] text-[11px] tracking-[2px]">MIDWAY GAMES</div>
            <h2 className="text-[#F8F4ED] text-2xl mt-1">{game?.name || 'Pick a booth'}</h2>
            <p className="text-[#EDE4D9]/90 text-sm mt-2 max-w-xl">{game?.blurb || 'Ring toss, ring the bell, bottles, and balloon darts — playable, not posters.'}</p>
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
          <RingToss
            onAgain={() => onNote('Another three rings.')}
            onLeave={() => setBooth(null)}
            onNote={onNote}
          />
        ) : booth === 'strongman' ? (
          <Strongman
            onAgain={() => onNote('The high striker resets.')}
            onLeave={() => setBooth(null)}
            onNote={onNote}
          />
        ) : booth === 'bottles' ? (
          <BottleKnock
            onAgain={() => onNote('Fresh milk bottles on the shelf.')}
            onLeave={() => setBooth(null)}
            onNote={onNote}
          />
        ) : (
          <BalloonDarts
            onAgain={() => onNote('New balloons, five darts.')}
            onLeave={() => setBooth(null)}
            onNote={onNote}
          />
        )}
      </div>
    </div>
  )
}

function GameChrome({
  hint,
  leftover,
  leftoverLabel,
  result,
  onAgain,
  onLeave,
  children,
}: {
  hint: string
  leftover: number
  leftoverLabel: string
  result: string
  onAgain: () => void
  onLeave: () => void
  children: ReactNode
}) {
  return (
    <div className="mt-6 flex-1 flex flex-col">
      <p className="text-[#EDE4D9] text-sm">{hint}</p>
      <div className="text-[#C9A962] text-xs tracking-widest mt-2">
        {leftover} {leftoverLabel}
      </div>
      <div className="mt-4">{children}</div>
      {result && <p className="text-[#F8F4ED] mt-4 text-sm">{result}</p>}
      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onAgain} className="btn btn-gold px-5 py-2 text-sm">
          Play again
        </button>
        <button type="button" onClick={onLeave} className="btn btn-outline px-5 py-2 text-sm">
          Other booths
        </button>
      </div>
    </div>
  )
}

function RingToss({
  onAgain,
  onLeave,
  onNote,
}: {
  onAgain: () => void
  onLeave: () => void
  onNote: (text: string) => void
}) {
  const [rings, setRings] = useState(3)
  const [ringed, setRinged] = useState<string[]>([])
  const [result, setResult] = useState('')
  const chance = useChance()

  const toss = (id: string) => {
    if (rings <= 0 || ringed.includes(id)) return
    const hit = chance(0.62)
    setRings((n) => n - 1)
    if (hit) {
      setRinged((prev) => [...prev, id])
      setResult('On the bottle.')
      onNote('A ring lands on a bottle.')
    } else {
      setResult('Off the neck — try the next one.')
      onNote('A ring glances off.')
    }
  }

  return (
    <GameChrome
      hint="Click a bottle to toss. Three rings."
      leftover={rings}
      leftoverLabel="rings left"
      result={result}
      onAgain={() => {
        setRings(3)
        setRinged([])
        setResult('')
        onAgain()
      }}
      onLeave={onLeave}
    >
      <div className="grid grid-cols-3 gap-3 max-w-md">
        {BOTTLES.map((bottle) => (
          <button
            key={bottle.id}
            type="button"
            disabled={rings <= 0}
            onClick={() => toss(bottle.id)}
            className={`h-20 rounded-2xl border text-sm ${
              ringed.includes(bottle.id)
                ? 'border-[#C9A962] bg-[#C9A962]/25 text-[#F8F4ED]'
                : 'border-white/25 bg-[#1A1418]/70 text-[#EDE4D9] hover:border-[#C9A962]/70'
            }`}
          >
            {ringed.includes(bottle.id) ? 'Ringed' : `Bottle ${bottle.label}`}
          </button>
        ))}
      </div>
    </GameChrome>
  )
}

function Strongman({
  onAgain,
  onLeave,
  onNote,
}: {
  onAgain: () => void
  onLeave: () => void
  onNote: (text: string) => void
}) {
  const [power, setPower] = useState(12)
  const [struck, setStruck] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    if (struck) return
    const id = window.setInterval(() => {
      setPower((p) => {
        const next = p + 4
        return next > 100 ? 8 : next
      })
    }, 70)
    return () => window.clearInterval(id)
  }, [struck])

  const strike = () => {
    if (struck) return
    setStruck(true)
    if (power >= 86) {
      setResult('The bell rings. The midway hears you.')
      onNote('The high striker rings the bell.')
    } else if (power >= 62) {
      setResult('Close — the puck climbs, then falls short.')
      onNote('Strong swing. No bell.')
    } else {
      setResult('A polite tap. The puck barely moves.')
      onNote('The mallet kisses the pad.')
    }
  }

  return (
    <GameChrome
      hint="The bar climbs. Strike when it is high."
      leftover={struck ? 0 : 1}
      leftoverLabel="swing left"
      result={result}
      onAgain={() => {
        setStruck(false)
        setPower(12)
        setResult('')
        onAgain()
      }}
      onLeave={onLeave}
    >
      <div className="max-w-md">
        <div className="h-4 rounded-full bg-[#1A1418]/80 border border-white/15 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#E8A0B8] to-[#C9A962]" style={{ width: `${power}%` }} />
        </div>
        <button
          type="button"
          onClick={strike}
          disabled={struck}
          className="btn btn-gold mt-4 px-8 py-3"
        >
          Strike
        </button>
      </div>
    </GameChrome>
  )
}

function BottleKnock({
  onAgain,
  onLeave,
  onNote,
}: {
  onAgain: () => void
  onLeave: () => void
  onNote: (text: string) => void
}) {
  const [balls, setBalls] = useState(3)
  const [down, setDown] = useState<string[]>([])
  const [result, setResult] = useState('')
  const chance = useChance()

  const throwBall = (id: string) => {
    if (balls <= 0 || down.includes(id)) return
    setBalls((n) => n - 1)
    const extra = chance(0.35) ? BOTTLES.find((b) => b.id !== id && !down.includes(b.id)) : null
    const fell = extra ? [id, extra.id] : [id]
    setDown((prev) => [...prev, ...fell])
    setResult(fell.length > 1 ? 'Two bottles go.' : 'One bottle down.')
    onNote(fell.length > 1 ? 'A throw takes two bottles.' : 'A bottle drops.')
  }

  return (
    <GameChrome
      hint="Click a bottle. Three softballs."
      leftover={balls}
      leftoverLabel="balls left"
      result={result}
      onAgain={() => {
        setBalls(3)
        setDown([])
        setResult('')
        onAgain()
      }}
      onLeave={onLeave}
    >
      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
        <div className="flex gap-2">
          {BOTTLES.slice(0, 2).map((b) => (
            <StackBottle key={b.id} label={b.label} down={down.includes(b.id)} disabled={balls <= 0} onClick={() => throwBall(b.id)} />
          ))}
        </div>
        <div className="flex gap-2">
          {BOTTLES.slice(2).map((b) => (
            <StackBottle key={b.id} label={b.label} down={down.includes(b.id)} disabled={balls <= 0} onClick={() => throwBall(b.id)} />
          ))}
        </div>
      </div>
    </GameChrome>
  )
}

function StackBottle({
  label,
  down,
  disabled,
  onClick,
}: {
  label: string
  down: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled || down}
      onClick={onClick}
      className={`w-16 h-16 rounded-full border text-xs ${
        down ? 'opacity-30 border-white/10 bg-[#1A1418]/40' : 'border-white/25 bg-[#1A1418]/70 hover:border-[#C9A962]/70 text-[#F8F4ED]'
      }`}
    >
      {down ? '—' : label}
    </button>
  )
}

function BalloonDarts({
  onAgain,
  onLeave,
  onNote,
}: {
  onAgain: () => void
  onLeave: () => void
  onNote: (text: string) => void
}) {
  const [darts, setDarts] = useState(5)
  const [popped, setPopped] = useState<string[]>([])
  const [result, setResult] = useState('')
  const chance = useChance()

  const throwDart = (id: string) => {
    if (darts <= 0 || popped.includes(id)) return
    const hit = chance(0.78)
    setDarts((n) => n - 1)
    if (hit) {
      setPopped((prev) => [...prev, id])
      setResult('Pop.')
      onNote('A balloon pops.')
    } else {
      setResult('The dart slips between.')
      onNote('A dart misses.')
    }
  }

  return (
    <GameChrome
      hint="Click a balloon. Five darts."
      leftover={darts}
      leftoverLabel="darts left"
      result={result}
      onAgain={() => {
        setDarts(5)
        setPopped([])
        setResult('')
        onAgain()
      }}
      onLeave={onLeave}
    >
      <div className="grid grid-cols-4 gap-2 max-w-md">
        {BALLOONS.map((id) => (
          <button
            key={id}
            type="button"
            disabled={darts <= 0 || popped.includes(id)}
            onClick={() => throwDart(id)}
            className={`h-12 rounded-full border text-[11px] capitalize ${
              popped.includes(id)
                ? 'opacity-25 border-white/10'
                : 'border-white/25 bg-[#1A1418]/65 text-[#F8F4ED] hover:border-[#E8A0B8]/70'
            }`}
          >
            {popped.includes(id) ? 'pop' : id}
          </button>
        ))}
      </div>
    </GameChrome>
  )
}
