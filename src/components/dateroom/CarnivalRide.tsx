import { useEffect, useRef, useState } from 'react'
import { showById, type RideBeat, type RideId, type RideMotion, type RideShow } from '../../data/carnival'

type CarnivalRideProps = {
  rideId: RideId
  onBack: () => void
  onNote: (text: string) => void
  muted?: boolean
  onRideActive?: (active: boolean) => void
}

export function CarnivalRide({ rideId, onBack, onNote, muted = false, onRideActive }: CarnivalRideProps) {
  const show = showById(rideId)
  if (!show) return null
  return (
    <RideShowView
      key={show.id}
      show={show}
      onBack={onBack}
      onNote={onNote}
      muted={muted}
      onRideActive={onRideActive}
    />
  )
}

function RideShowView({
  show,
  onBack,
  onNote,
  muted,
  onRideActive,
}: {
  show: RideShow
  onBack: () => void
  onNote: (text: string) => void
  muted: boolean
  onRideActive?: (active: boolean) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'queue' | 'ride'>('queue')
  const [now, setNow] = useState(0)
  const [dur, setDur] = useState(show.beats.reduce((sum, beat) => sum + beat.durationMs, 0) / 1000)
  const [ended, setEnded] = useState(false)
  const [chrome, setChrome] = useState(true)

  useEffect(() => {
    onNote(show.queueChat)
    const id = window.setTimeout(() => {
      setPhase('ride')
    }, show.queue.durationMs)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.id])

  useEffect(() => {
    if (phase === 'ride') onNote(show.rideChat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, show.id])

  useEffect(() => {
    onRideActive?.(phase === 'ride')
  }, [phase, onRideActive])

  useEffect(() => {
    return () => onRideActive?.(false)
  }, [onRideActive])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
    el.volume = 0.86
  }, [muted, phase])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => setNow(el.currentTime)
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDur(el.duration)
    }
    const onEnd = () => {
      setEnded(true)
      setChrome(true)
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [show.film])

  useEffect(() => {
    if (phase !== 'ride' || ended) return
    const el = videoRef.current
    if (!el) return
    el.muted = muted
    void el.play().catch(() => {})
  }, [phase, show.film, muted, ended])

  useEffect(() => {
    if (ended || phase !== 'ride') return
    setChrome(true)
    const hide = window.setTimeout(() => setChrome(false), 4200)
    return () => window.clearTimeout(hide)
  }, [ended, show.film, phase])

  const startFilm = () => {
    setPhase('ride')
    const el = videoRef.current
    if (!el) return
    el.muted = muted
    el.volume = 0.86
    void el.play().catch(() => {
      el.muted = true
      void el.play().catch(() => {})
    })
  }

  const replay = () => {
    const el = videoRef.current
    setEnded(false)
    setChrome(true)
    if (!el) return
    el.currentTime = 0
    el.muted = muted
    void el.play().catch(() => {})
  }

  const left = Math.max(0, dur - now)
  const kicker =
    show.flavor === 'hollow'
      ? 'BOAT JOURNEY'
      : show.flavor === 'wheel'
        ? 'THE WHEEL TURNS'
        : show.flavor === 'carousel'
          ? 'THE ROUND TURNS'
          : 'ON THE RIDE'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#C9A962]/25 min-h-[560px]">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          show.flavor === 'coaster' ? 'object-contain bg-[#120C0E]' : 'object-cover'
        } ${phase === 'ride' ? 'opacity-100' : 'opacity-0'} ${show.flavor === 'carousel' ? 'carnival-film-bob' : ''}`}
        src={show.film}
        poster={show.queue.src}
        playsInline
        preload="auto"
      />
      {phase === 'queue' ? (
        <QueueBeat beat={show.queue} flavor={show.flavor} onBoard={startFilm} onBack={onBack} />
      ) : (
        <>
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
              ended || chrome
                ? 'bg-gradient-to-t from-[#0F0A0D]/70 via-transparent to-[#0F0A0D]/25'
                : 'bg-gradient-to-t from-[#0F0A0D]/28 via-transparent to-[#0F0A0D]/10'
            }`}
          />
          {show.flavor === 'hollow' && <Fireflies />}
          {show.flavor === 'flume' && <div className="carnival-water absolute inset-0" />}
          {show.flavor === 'wheel' && (
            <FerrisGraphic className="absolute right-4 top-28 w-28 h-28 md:w-36 md:h-36 z-[5] opacity-90" />
          )}
          <Overlay
            kicker={kicker}
            title={ended ? 'Unload' : 'On the ride'}
            line={
              ended
                ? 'The ride has finished. Ride again, or walk back to the midway.'
                : `${formatFilmTime(left)} left on this run.`
            }
            onBack={onBack}
            action={ended ? replay : undefined}
            actionLabel={ended ? 'Ride again' : undefined}
            faded={!ended && !chrome}
          />
          <div className="absolute bottom-6 left-6 right-6 z-10 h-1.5 rounded-full bg-white/15 overflow-hidden pointer-events-none">
            <div className="h-full bg-[#C9A962]" style={{ width: `${dur > 0 ? Math.min(100, (now / dur) * 100) : 0}%` }} />
          </div>
        </>
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
  faded,
}: {
  kicker: string
  title: string
  line: string
  onBack: () => void
  action?: () => void
  actionLabel?: string
  faded?: boolean
}) {
  return (
    <div className="relative z-10 p-5 md:p-8 flex flex-col min-h-[560px] pointer-events-none">
      <div className="flex items-start justify-between gap-3">
        <div className={`transition-opacity duration-700 ${faded ? 'opacity-0' : 'opacity-100'}`}>
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
      <p
        className={`text-[#F8F4ED] text-lg mt-8 max-w-xl leading-relaxed drop-shadow transition-opacity duration-700 ${
          faded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {line}
      </p>
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
