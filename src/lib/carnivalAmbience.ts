import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'pd-carnival-mute'
const TARGET = 0.07

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

type Bed = {
  ctx: AudioContext
  gain: GainNode
  stop: () => void
}

function makeCrowdBuffer(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 2.4)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    last = last * 0.975 + (Math.random() * 2 - 1) * 0.04
    data[i] = last
  }
  return buffer
}

function startBed(): Bed | null {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const noise = ctx.createBufferSource()
  noise.buffer = makeCrowdBuffer(ctx)
  noise.loop = true
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 520
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.55
  noise.connect(low)
  low.connect(noiseGain)
  noiseGain.connect(master)
  noise.start()

  const tone = ctx.createOscillator()
  tone.type = 'sine'
  tone.frequency.value = 196
  const toneFilter = ctx.createBiquadFilter()
  toneFilter.type = 'lowpass'
  toneFilter.frequency.value = 420
  const toneGain = ctx.createGain()
  toneGain.gain.value = 0.012
  tone.connect(toneFilter)
  toneFilter.connect(toneGain)
  toneGain.connect(master)
  tone.start()

  const fifth = ctx.createOscillator()
  fifth.type = 'sine'
  fifth.frequency.value = 294
  const fifthGain = ctx.createGain()
  fifthGain.gain.value = 0.007
  fifth.connect(fifthGain)
  fifthGain.connect(master)
  fifth.start()

  return {
    ctx,
    gain: master,
    stop: () => {
      try {
        noise.stop()
        tone.stop()
        fifth.stop()
      } catch {
        /* already closed */
      }
      void ctx.close()
    },
  }
}

/** Soft original bed: crowd murmur + two quiet tones. No copyrighted carousel tune. */
export function useCarnivalAmbience(active: boolean) {
  const bedRef = useRef<Bed | null>(null)
  const [muted, setMuted] = useState(readMuted)

  const fadeTo = useCallback((to: number, ms: number, then?: () => void) => {
    const bed = bedRef.current
    if (!bed) {
      then?.()
      return
    }
    const now = bed.ctx.currentTime
    bed.gain.gain.cancelScheduledValues(now)
    bed.gain.gain.setValueAtTime(bed.gain.gain.value, now)
    bed.gain.gain.linearRampToValueAtTime(to, now + ms / 1000)
    if (then) window.setTimeout(then, ms)
  }, [])

  useEffect(() => {
    return () => {
      bedRef.current?.stop()
      bedRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active || muted) {
      fadeTo(0, active ? 400 : 700)
      return
    }

    const ensure = () => {
      if (!bedRef.current) bedRef.current = startBed()
      const bed = bedRef.current
      if (!bed) return
      void bed.ctx.resume().then(() => fadeTo(TARGET, 1400)).catch(() => {})
    }

    ensure()
    const kick = () => ensure()
    window.addEventListener('pointerdown', kick, { once: true })
    return () => window.removeEventListener('pointerdown', kick)
  }, [active, muted, fadeTo])

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current
      writeMuted(next)
      return next
    })
  }

  const fadeOutAndStop = (then?: () => void) => {
    fadeTo(0, 700, () => {
      bedRef.current?.stop()
      bedRef.current = null
      then?.()
    })
  }

  return { muted, toggleMute, fadeOutAndStop }
}
