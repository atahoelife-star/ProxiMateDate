import { FeedbackForm } from './FeedbackForm'
import type { FeedbackRoom } from '../lib/feedback'

type DateFeedbackPromptProps = {
  open: boolean
  room: Exclude<FeedbackRoom, 'site'>
  plan?: string
  onFinish: () => void
}

export function DateFeedbackPrompt({ open, room, plan, onFinish }: DateFeedbackPromptProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4">
      <div
        className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8"
        role="dialog"
        aria-labelledby="date-feedback-title"
      >
        <FeedbackForm
          room={room}
          plan={plan}
          source="end-of-date"
          title="How was tonight?"
          body="Three taps is plenty. A short note is welcome if something stood out."
          submitLabel="Send"
          skipLabel="Skip"
          onDone={onFinish}
          onSkip={onFinish}
        />
      </div>
    </div>
  )
}
