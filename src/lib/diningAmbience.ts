import { useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'pd-dining-mute'
const SRC = '/audio/dining-room.mp3'
const TARGET_VOLUME = 0.22
const FADE_MS = 1600

function readMuted() {
  try {
    return sessionStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(muted: boolean) {
  try {
    sessionStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* private mode */
  }
}

/** Soft dining bed after seating only. Never used on the marketing homepage. */
export function useDiningAmbience(active: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  const [muted, setMuted] = useState(readMuted)

  useEffect(() => {
    const el = new Audio(SRC)
    el.loop = true
    el.preload = 'auto'
    el.volume = 0
    audioRef.current = el
    return () => {
      if (fadeRef.current) window.cancelAnimationFrame(fadeRef.current)
      el.pause()
      el.removeAttribute('src')
      el.load()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const fadeTo = (to: number, ms: number, then?: () => void) => {
      if (fadeRef.current) window.cancelAnimationFrame(fadeRef.current)
      const from = el.volume
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms)
        el.volume = from + (to - from) * t
        if (t < 1) fadeRef.current = window.requestAnimationFrame(tick)
        else then?.()
      }
      fadeRef.current = window.requestAnimationFrame(tick)
    }

    if (!active || muted) {
      fadeTo(0, active ? 500 : 900, () => el.pause())
      return
    }

    const start = () => {
      void el.play().then(() => fadeTo(TARGET_VOLUME, FADE_MS)).catch(() => {
        /* Autoplay can wait for a click or the mute control. */
      })
    }
    start()
    const kick = () => start()
    window.addEventListener('pointerdown', kick, { once: true })
    return () => window.removeEventListener('pointerdown', kick)
  }, [active, muted])

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current
      writeMuted(next)
      return next
    })
  }

  return { muted, toggleMute }
}
