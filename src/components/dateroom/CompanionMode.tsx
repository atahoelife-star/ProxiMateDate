import { useState } from 'react'
import { X } from 'lucide-react'

const SERVICES = ['Netflix', 'Hulu', 'Disney+', 'Prime Video'] as const

type CompanionModeProps = {
  partnerName: string
  open: boolean
  onClose: () => void
  onRoomMessage: (text: string) => void
}

export function CompanionMode({ partnerName, open, onClose, onRoomMessage }: CompanionModeProps) {
  const [service, setService] = useState<(typeof SERVICES)[number]>('Netflix')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [watching, setWatching] = useState(false)

  const startCountdown = () => {
    setWatching(false)
    setCountdown(5)
    onRoomMessage(`Starting a 5-second countdown for ${service}. ${partnerName} should open their own app — not this website.`)
    let n = 5
    const id = window.setInterval(() => {
      n -= 1
      if (n <= 0) {
        window.clearInterval(id)
        setCountdown(null)
        setWatching(true)
        onRoomMessage(`Companion: press play on ${service} on your own apps. We cannot play that catalog here.`)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="modal w-full max-w-lg bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[#F8F4ED] text-2xl">Watch on your own apps</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="text-[#A8988A]" />
          </button>
        </div>
        <p className="text-[#A8988A] text-sm leading-relaxed mb-4">
          We do not embed, scrape, or proxy {SERVICES.join(', ')}. There is no fake player. Each of you opens the real app on another screen. Chat stays here. We do not put those catalogs in this page.
        </p>
        <label className="text-xs tracking-widest text-[#A8988A] block mb-1.5">SERVICE</label>
        <select className="input w-full mb-5" value={service} onChange={(e) => setService(e.target.value as (typeof SERVICES)[number])}>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {countdown !== null && (
          <div className="text-center text-6xl font-serif text-[#C9A962] mb-6">{countdown}</div>
        )}
        {watching && countdown === null && (
          <p className="text-[#EDE4D9] text-sm mb-4">Companion is live. Press play in {service} together. We are not streaming it.</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" className="btn btn-gold flex-1" onClick={startCountdown}>
            Countdown 5
          </button>
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => {
              setWatching(false)
              setCountdown(null)
              onRoomMessage('Companion paused. Movie night is still here.')
            }}
          >
            Stop companion
          </button>
        </div>
      </div>
    </div>
  )
}
