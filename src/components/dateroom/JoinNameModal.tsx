import { useState } from 'react'

type JoinNameModalProps = {
  open: boolean
  onSave: (name: string) => void
}

export function JoinNameModal({ open, onSave }: JoinNameModalProps) {
  const [name, setName] = useState('')
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4">
      <form
        className="modal w-full max-w-sm bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8"
        onSubmit={(event) => {
          event.preventDefault()
          const next = name.trim()
          if (next) onSave(next)
        }}
      >
        <h3 className="text-[#F8F4ED] text-2xl mb-2">What should we call you?</h3>
        <p className="text-[#A8988A] text-sm mb-5">This name is yours on this date. Your date picks their own — we don’t reuse one default for both of you.</p>
        <input
          className="input w-full mb-5"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your first name"
          autoFocus
          maxLength={32}
        />
        <button type="submit" className="btn btn-gold w-full py-3" disabled={!name.trim()}>
          Join this date
        </button>
      </form>
    </div>
  )
}
