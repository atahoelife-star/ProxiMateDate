import { useEffect, useRef, useState } from 'react'
import type { ArrivalBeat } from '../../data/arrival'
import { lookBackdrop, lookThumb } from '../../lib/restaurantLook'
import { playHostVoice, stopHostVoice } from '../../lib/hostVoice'

/** Grand hotel double doors — never waiter/service swinging doors. */
const DOOR_OPEN_AFTER_MS = 90
const HOST_AFTER_MS = 1100
const DONE_MS = 5600
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
      <div className="ge-door-face">
        <div className="ge-door-panel ge-door-panel-top" />
        <div className="ge-door-panel ge-door-panel-bot" />
        <div className="ge-handle">
          <span className="ge-handle-plate" />
          <span className="ge-handle-lever" />
        </div>
        <div className="ge-kick" />
      </div>
      <div className="ge-door-edge" />
    </div>
  )
}

export function HostLeadIn({ look, onDone }: HostLeadInProps) {
  const [open, setOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const backdrop = lookBackdrop(look)
  const poster = lookThumb(look)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const openTimer = window.setTimeout(() => setOpen(true), reduced ? 0 : DOOR_OPEN_AFTER_MS)
    const hostTimer = window.setTimeout(() => playHostVoice(), reduced ? 60 : HOST_AFTER_MS)
    const doneTimer = window.setTimeout(onDone, reduced ? REDUCED_DONE_MS : DONE_MS)
    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(hostTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    el.playsInline = true
    el.playbackRate = 1
    void el.play().catch(() => {})
  }, [backdrop.src])

  return (
    <div
      className={`grand-entrance${open ? ' is-open' : ''}`}
      role="dialog"
      aria-label="Entering the dining room"
    >
      <div className="ge-interior">
        {backdrop.kind === 'video' ? (
          <video
            ref={videoRef}
            className="ge-room"
            src={backdrop.src}
            poster={poster}
            muted
            playsInline
            autoPlay
            loop
            onLoadedData={(event) => {
              const el = event.currentTarget
              el.muted = true
              el.playbackRate = 1
              void el.play().catch(() => {})
            }}
          />
        ) : (
          <img className="ge-room" src={backdrop.src} alt="" />
        )}
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

      <button
        type="button"
        className="absolute top-6 right-6 z-10 btn btn-ghost text-sm px-5 py-2 border border-white/20"
        onClick={() => {
          stopHostVoice()
          onDone()
        }}
      >
        Skip
      </button>
    </div>
  )
}
