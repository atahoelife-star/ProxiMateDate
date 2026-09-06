import { useEffect, useRef, useState } from 'react'
import { showById, type RideBeat, type RideId, type RideMotion, type RideShow } from '../../data/carnival'

type CarnivalRideProps = {
  rideId: RideId
  onBack: () => void
  onNote: (text: string) => void
}

export function CarnivalRide({ rideId, onBack, onNote }: CarnivalRideProps) {
  const show = showById(rideId)
  if (!show) return null
  return <RideShowView key={show.id} show={show} onBack={onBack} onNote={onNote} />
}

function RideShowView({
  show,
  onBack,
  onNote,
}: {
  show: RideShow
  onBack: () => void
  onNote: (text: string) => void
}) {
  const [phase, setPhase] = useState<'queue' | 'ride'>('queue')

  useEffect(() => {
    onNote(show.queueChat)
    const id = window.setTimeout(() => setPhase('ride'), show.queue.durationMs)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.id])

  useEffect(() => {
    if (phase === 'ride') onNote(show.rideChat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, show.id])

  const board = () => setPhase('ride')

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[560px]">
      {phase === 'queue' ? (
        <QueueBeat beat={show.queue} flavor={show.flavor} onBoard={board} onBack={onBack} />
      ) : (
        <RideFilm show={show} onBack={onBack} />
      )}
    </div>
  )
}

function Overlay({
  kicker,
  title,
  line,
  onBack,
  action,
  actionLabel,
}: {
  kicker: string
  title: string
  line: string
  onBack: () => void
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[560px] pointer-events-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[#C9A962] text-[11px] tracking-[2px]">{kicker}</div>
          <h2 className="text-[#F8F4ED] text-3xl mt-1">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost text-sm px-4 py-2 border border-white/20 pointer-events-auto"
        >
          Midway
        </button>
      </div>
      <p className="text-[#F8F4ED] text-lg mt-8 max-w-xl leading-relaxed drop-shadow">{line}</p>
      {action && actionLabel && (
        <div className="mt-auto pt-8">
          <button type="button" onClick={action} className="btn btn-gold px-5 py-2 text-sm pointer-events-auto">
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function MovingStill({ src, motion, flavor }: { src: string; motion: RideMotion; flavor: RideShow['flavor'] }) {
  return (
    <>
      <img src={src} alt="" className={`carnival-ride-still carnival-ride-${motion} absolute inset-0 w-full h-full object-cover`} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/80 via-transparent to-[#0F0A0D]/25" />
      {flavor === 'coaster' && motion === 'drop' && <div className="carnival-shake absolute inset-0" />}
      {flavor === 'flume' && <div className="carnival-water absolute inset-0" />}
      {flavor === 'hollow' && <Fireflies />}
    </>
  )
}

function QueueBeat({
  beat,
  flavor,
  onBoard,
  onBack,
}: {
  beat: RideBeat
  flavor: RideShow['flavor']
  onBoard: () => void
  onBack: () => void
}) {
  return (
    <>
      <MovingStill src={beat.src} motion={beat.motion} flavor={flavor} />
      {flavor === 'wheel' && <FerrisGraphic className="absolute right-4 bottom-24 w-40 h-40 md:w-52 md:h-52 z-[5]" />}
      {flavor === 'carousel' && <div className="carnival-queue-spin absolute inset-0 pointer-events-none" />}
      <Overlay
        kicker="QUEUE"
        title={beat.title}
        line={beat.line}
        onBack={onBack}
        action={onBoard}
        actionLabel="Board now"
      />
    </>
  )
}

function formatFilmTime(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function RideFilm({ show, onBack }: { show: RideShow; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [now, setNow] = useState(0)
  const [dur, setDur] = useState(show.beats.reduce((sum, beat) => sum + beat.durationMs, 0) / 1000)
  const [ended, setEnded] = useState(false)
  const mounts = ['horse', 'fox', 'horse', 'stag', 'horse', 'fox'] as const

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => setNow(el.currentTime)
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDur(el.duration)
    }
    const onEnd = () => setEnded(true)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    void el.play().catch(() => {})
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [show.film])

  const replay = () => {
    const el = videoRef.current
    setEnded(false)
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => {})
  }

  const left = Math.max(0, dur - now)
  const kicker =
    show.flavor === 'hollow' ? 'BOAT JOURNEY' : show.flavor === 'wheel' ? 'THE WHEEL TURNS' : show.flavor === 'carousel' ? 'THE ROUND TURNS' : 'ON THE RIDE'

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={show.film}
        poster={show.queue.src}
        playsInline
        muted
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/70 via-transparent to-[#0F0A0D]/25 pointer-events-none" />
      {show.flavor === 'hollow' && <Fireflies />}
      {show.flavor === 'flume' && <div className="carnival-water absolute inset-0" />}
      {show.flavor === 'wheel' && <FerrisGraphic className="absolute right-4 top-28 w-28 h-28 md:w-36 md:h-36 z-[5] opacity-90" />}
      {show.flavor === 'carousel' && (
        <div className="carnival-carousel-stage absolute inset-0 pointer-events-none z-[4]">
          <div className="carnival-carousel-ring">
            {mounts.map((kind, i) => (
              <div
                key={`${kind}-${i}`}
                className={`carnival-carousel-mount carnival-bob carnival-bob-${i % 3}`}
                style={{ transform: `rotateY(${i * 60}deg) translateZ(168px)` }}
              >
                <div className={`carnival-mount-figure carnival-mount-${kind}`} />
              </div>
            ))}
          </div>
        </div>
      )}
      <Overlay
        kicker={kicker}
        title={ended ? 'Unload' : 'On the ride'}
        line={
          ended
            ? 'The ride has finished. Ride again, or walk back to the midway.'
            : `${formatFilmTime(left)} left on this run. The picture keeps moving.`
        }
        onBack={onBack}
        action={ended ? replay : undefined}
        actionLabel={ended ? 'Ride again' : undefined}
      />
      <div className="absolute bottom-6 left-6 right-6 z-10 h-1.5 rounded-full bg-white/15 overflow-hidden pointer-events-none">
        <div className="h-full bg-[#C9A962]" style={{ width: `${dur > 0 ? Math.min(100, (now / dur) * 100) : 0}%` }} />
      </div>
    </>
  )
}

function FerrisGraphic({ className }: { className?: string }) {
  const seats = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <div className={`carnival-ferris ${className ?? ''}`} aria-hidden>
      <div className="carnival-ferris-wheel">
        {seats.map((deg) => (
          <div key={deg} className="carnival-ferris-arm" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="carnival-ferris-car" />
          </div>
        ))}
        <div className="carnival-ferris-hub" />
      </div>
    </div>
  )
}

function Fireflies() {
  const dots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  return (
    <div className="carnival-fireflies absolute inset-0 pointer-events-none" aria-hidden>
      {dots.map((n) => (
        <span key={n} className={`carnival-firefly carnival-firefly-${n}`} />
      ))}
    </div>
  )
}
