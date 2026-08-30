import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ArrivalBeat } from '../../data/arrival'
import { lookThumb } from '../../lib/restaurantLook'
import { stopHostVoice } from '../../lib/hostVoice'

const LEAD_MS = 4200

type HostLeadInProps = {
  look: ArrivalBeat
  onDone: () => void
}

export function HostLeadIn({ look, onDone }: HostLeadInProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(onDone, LEAD_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    el.playsInline = true
    el.playbackRate = 1
    void el.play().catch(() => {})
  }, [])

  const chosen = lookThumb(look)

  return (
    <div className="fixed inset-0 z-[195] bg-[#0F0A0D]" role="dialog" aria-label="Host seating you">
      <motion.video
        ref={videoRef}
        src="/videos/waiter-idle.mp4"
        poster="/images/arrival/restaurant/host.jpg"
        muted
        playsInline
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 1, scale: 1.04 }}
        animate={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 1.8, delay: 1.15, ease: 'easeInOut' }}
      />
      <motion.img
        src={chosen}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.55, delay: 1.45, ease: 'easeOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D]/30 via-transparent to-[#0F0A0D]/15 pointer-events-none" />
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
