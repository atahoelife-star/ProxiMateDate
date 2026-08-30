import { useEffect, useRef, useState } from 'react'

const SERVICES = ['Netflix', 'Hulu', 'Disney+', 'Prime Video'] as const

type OwnAppsCountdownProps = {
  partnerName: string
  onRoomMessage: (text: string) => void
}

/** Countdown only. Does not embed or proxy Netflix/Hulu/Disney+/Prime. */
export function OwnAppsCountdown({ partnerName, onRoomMessage }: OwnAppsCountdownProps) {
  const [service, setService] = useState<(typeof SERVICES)[number]>('Netflix')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [watching, setWatching] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current == null) return
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => () => clearTimer(), [])

  const startCountdown = () => {
    clearTimer()
    setWatching(false)
    setCountdown(5)
    onRoomMessage(
      `Starting a 5-second countdown for ${service}. ${partnerName} should open their own app — not this website.`,
    )
    let n = 5
    timerRef.current = window.setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearTimer()
        setCountdown(null)
        setWatching(true)
        onRoomMessage(`Press play on ${service} on your own apps. We cannot play that catalog here.`)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  return (
    <div className="flex flex-col flex-1 min-h-[280px]">
      <p className="text-[#A8988A] text-sm mb-4">
        Each of you opens {service} on another screen. Chat stays here. We do not embed or proxy {SERVICES.join(', ')}.
      </p>
      <label className="text-xs tracking-widest text-[#A8988A] block mb-1.5">SERVICE</label>
      <select
        className="input w-full mb-5"
        value={service}
        onChange={(e) => setService(e.target.value as (typeof SERVICES)[number])}
      >
        {SERVICES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="video-frame video-frame-watch flex-1 min-h-[220px] mb-5">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {countdown !== null ? (
            <div className="text-7xl sm:text-8xl font-serif text-[#C9A962] tabular-nums">{countdown}</div>
          ) : watching ? (
            <p className="text-[#EDE4D9] text-lg">Press play in {service} together.</p>
          ) : (
            <p className="text-[#A8988A] text-sm max-w-xs">Countdown to hit play at the same time on your own apps.</p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" className="btn btn-gold flex-1" onClick={startCountdown}>
          Countdown 5
        </button>
        <button
          type="button"
          className="btn btn-outline flex-1"
          onClick={() => {
            clearTimer()
            setWatching(false)
            setCountdown(null)
            onRoomMessage('Own-apps countdown stopped. Movie night is still here.')
          }}
        >
          Stop countdown
        </button>
      </div>
    </div>
  )
}
