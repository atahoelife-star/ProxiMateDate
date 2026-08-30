import { useEffect, useRef, useState } from 'react'
import type { ArrivalBeat } from '../../data/arrival'
import { lookThumb } from '../../lib/restaurantLook'
import { playHostVoice, stopHostVoice } from '../../lib/hostVoice'

/** Photoreal wood/glass restaurant double doors into the chosen dining room.
 *  Never waiter/kitchen swinging doors, never the mustard CSS leaf swing. */
const HOST_AFTER_MS = 1550
const DONE_AFTER_PLAYING_MS = 7400
const REDUCED_DONE_MS = 1400
const PLAY_FALLBACK_MS = 11000
const CLOSED_DOORS = '/images/arrival/restaurant/grand-doors.jpg'

type HostLeadInProps = {
  look: ArrivalBeat
  onDone: () => void
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function doorClip(look: ArrivalBeat) {
  const id = look.id === 'doors' ? 'tables' : look.id
  return `/videos/grand-doors-${id}.mp4`
}

export function HostLeadIn({ look, onDone }: HostLeadInProps) {
  const [open, setOpen] = useState(false)
  const [useCss, setUseCss] = useState(false)
  const finished = useRef(false)
  const playing = useRef(false)
  const interior = lookThumb(look)
  const src = doorClip(look)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    stopHostVoice()
    onDone()
  }

  useEffect(() => {
    if (useCss) return
    const fallback = window.setTimeout(finish, PLAY_FALLBACK_MS)
    return () => window.clearTimeout(fallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCss])

  useEffect(() => {
    if (!useCss) return
    const reduced = prefersReducedMotion()
    const openTimer = window.setTimeout(() => setOpen(true), reduced ? 0 : 480)
    const hostTimer = window.setTimeout(() => playHostVoice(), reduced ? 60 : HOST_AFTER_MS)
    const doneTimer = window.setTimeout(finish, reduced ? REDUCED_DONE_MS : DONE_AFTER_PLAYING_MS)
    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(hostTimer)
      window.clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCss, onDone])

  return (
    <div
      className={`grand-entrance${useCss && open ? ' is-open' : ''}`}
      role="dialog"
      aria-label="Entering the dining room"
    >
      {!useCss ? (
        <>
          <img className="ge-room" src={CLOSED_DOORS} alt="" />
          <video
            className="ge-room"
            src={src}
            poster={CLOSED_DOORS}
            autoPlay
            muted
            playsInline
            onPlaying={() => {
              if (playing.current) return
              playing.current = true
              window.setTimeout(() => playHostVoice(), HOST_AFTER_MS)
              window.setTimeout(finish, DONE_AFTER_PLAYING_MS)
            }}
            onEnded={finish}
            onError={() => setUseCss(true)}
          />
          <div className="ge-vignette" />
        </>
      ) : (
        <>
          <img className="ge-room" src={interior} alt="" />
          <img className={`ge-room ge-closed-poster${open ? ' is-fading' : ''}`} src={CLOSED_DOORS} alt="" />
          <div className="ge-vignette" />
        </>
      )}

      <button
        type="button"
        className="absolute top-6 right-6 z-10 btn btn-ghost text-sm px-5 py-2 border border-white/20"
        onClick={finish}
      >
        Skip
      </button>
    </div>
  )
}
