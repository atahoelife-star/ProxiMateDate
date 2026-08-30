import { useEffect, useRef, useState } from 'react'
import type { ArrivalBeat } from '../../data/arrival'
import { lookThumb } from '../../lib/restaurantLook'
import { playHostVoice, stopHostVoice } from '../../lib/hostVoice'

/** Photoreal double doors into the chosen dining room — never waiter/kitchen swinging doors. */
const HOST_AFTER_MS = 1550
const DONE_MS = 6400
const REDUCED_DONE_MS = 1400

type HostLeadInProps = {
  look: ArrivalBeat
  onDone: () => void
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function DoorLeaf({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`ge-door ge-door-${side === 'left' ? 'l' : 'r'}`} aria-hidden>
      <div className="ge-door-face" />
      <div className="ge-door-edge" />
    </div>
  )
}

function doorClip(look: ArrivalBeat) {
  const id = look.id === 'doors' ? 'tables' : look.id
  return `/videos/grand-doors-${id}.mp4`
}

export function HostLeadIn({ look, onDone }: HostLeadInProps) {
  const [open, setOpen] = useState(false)
  const [useCss, setUseCss] = useState(false)
  const finished = useRef(false)
  const interior = lookThumb(look)
  const src = doorClip(look)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    stopHostVoice()
    onDone()
  }

  useEffect(() => {
    const reduced = prefersReducedMotion()
    if (reduced) {
      const doneTimer = window.setTimeout(finish, REDUCED_DONE_MS)
      return () => window.clearTimeout(doneTimer)
    }
    const openTimer = window.setTimeout(() => setOpen(true), 480)
    const hostTimer = window.setTimeout(() => playHostVoice(), HOST_AFTER_MS)
    const doneTimer = window.setTimeout(finish, DONE_MS)
    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(hostTimer)
      window.clearTimeout(doneTimer)
    }
    // finish is stable for this mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone])

  return (
    <div
      className={`grand-entrance${open || !useCss ? ' is-open' : ''}`}
      role="dialog"
      aria-label="Entering the dining room"
    >
      {!useCss ? (
        <>
          <video
            className="ge-room absolute inset-0 w-full h-full object-cover"
            src={src}
            poster={interior}
            autoPlay
            muted
            playsInline
            onEnded={finish}
            onError={() => setUseCss(true)}
          />
          <div className="ge-vignette" />
        </>
      ) : (
        <>
          <div className={`ge-interior${open ? ' is-revealed' : ''}`}>
            <img className="ge-room" src={interior} alt="" />
            <div className="ge-veil" />
            <div className="ge-rays" />
          </div>
          <div className="ge-stage">
            <div className="ge-arch">
              <div className="ge-transom" />
              <div className="ge-portal">
                <div className="ge-seam" />
                <DoorLeaf side="left" />
                <DoorLeaf side="right" />
              </div>
              <div className="ge-threshold" />
            </div>
          </div>
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
