import { useState, type FormEvent } from 'react'
import {
  FEEDBACK_RATINGS,
  FEEDBACK_ROOMS,
  submitFeedback,
  type FeedbackRating,
  type FeedbackRoom,
  type FeedbackSource,
} from '../lib/feedback'

type FeedbackFormProps = {
  room: FeedbackRoom
  plan?: string
  source: FeedbackSource
  showRoomPicker?: boolean
  title: string
  body: string
  submitLabel?: string
  skipLabel: string
  onDone: () => void
  onSkip: () => void
}

export function FeedbackForm({
  room: initialRoom,
  plan,
  source,
  showRoomPicker = false,
  title,
  body,
  submitLabel = 'Send',
  skipLabel,
  onDone,
  onSkip,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [note, setNote] = useState('')
  const [room, setRoom] = useState<FeedbackRoom>(initialRoom)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!rating || busy) return
    setBusy(true)
    setError(false)
    const ok = await submitFeedback({ rating, note, room, plan, source })
    setBusy(false)
    if (!ok) {
      setError(true)
      return
    }
    setSent(true)
    window.setTimeout(onDone, 1100)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <h3 className="text-[#F8F4ED] text-2xl mb-2">Thank you.</h3>
        <p className="text-[#A8988A] text-sm">That’s all — enjoy the rest of your night.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h3 id="date-feedback-title" className="text-[#F8F4ED] text-2xl mb-2">
          {title}
        </h3>
        <p className="text-[#A8988A] text-sm">{body}</p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="How was tonight">
        {FEEDBACK_RATINGS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRating(item.value)}
            className={`rounded-2xl border px-2 py-3 text-sm transition ${
              rating === item.value
                ? 'border-[#C9A962] bg-[#C9A962]/15 text-[#F8F4ED]'
                : 'border-[#3A2F36] text-[#EDE4D9] hover:border-[#C9A962]/60'
            }`}
            aria-pressed={rating === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showRoomPicker && (
        <label className="block">
          <span className="text-[#A8988A] text-xs tracking-wide uppercase">Which evening</span>
          <select
            value={room}
            onChange={(event) => setRoom(event.target.value as FeedbackRoom)}
            className="mt-2 w-full rounded-lg bg-[#1A1216] border border-[#3A2F36] px-3 py-2 text-[#F8F4ED]"
          >
            {FEEDBACK_ROOMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="sr-only">Optional note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 800))}
          rows={3}
          placeholder="Anything we should know? (optional)"
          className="w-full rounded-lg bg-[#1A1216] border border-[#3A2F36] px-4 py-3 text-[#F8F4ED] placeholder:text-[#7A6B5F]"
        />
      </label>

      {error && <p className="text-[#E8A0B8] text-sm">Couldn’t send that. Try once more, or skip.</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="submit" className="btn btn-gold flex-1 py-3" disabled={!rating || busy}>
          {busy ? 'Sending…' : submitLabel}
        </button>
        <button type="button" className="btn btn-ghost flex-1 py-3 border border-white/15" onClick={onSkip}>
          {skipLabel}
        </button>
      </div>
    </form>
  )
}
