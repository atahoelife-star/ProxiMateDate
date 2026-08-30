import { useState } from 'react'
import { toast } from 'sonner'
import { submitWaitlist } from '../lib/waitlist'

type WaitlistFormProps = {
  intent: string
  plan?: string
  heading?: string
  description?: string
  submitLabel?: string
  showName?: boolean
  showMessage?: boolean
}

export function WaitlistForm({
  intent,
  plan,
  heading,
  description,
  submitLabel = 'Join the list',
  showName = true,
  showMessage = false,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await submitWaitlist({ email, name, intent, plan, message })
      setStatus('sent')
      toast.success('You’re on the list', {
        description: 'We’ll email you at this address. Nothing is charged.',
      })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-6 text-center">
        <div className="text-[#C9A962] text-xs tracking-[2px] mb-2">WAITLIST</div>
        <h3 className="text-[#F8F4ED] text-2xl mb-2">You’re on the list</h3>
        <p className="text-[#A8988A] text-sm leading-relaxed">
          We saved {email} for ProxiMateDate. We’ll write when we have something to share.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {heading && <h3 className="text-[#F8F4ED] text-2xl">{heading}</h3>}
      {description && <p className="text-[#A8988A] text-sm leading-relaxed">{description}</p>}
      {showName && (
        <div>
          <label className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1 block" htmlFor={`name-${intent}`}>
            NAME (OPTIONAL)
          </label>
          <input
            id={`name-${intent}`}
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
      )}
      <div>
        <label className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1 block" htmlFor={`email-${intent}`}>
          EMAIL
        </label>
        <input
          id={`email-${intent}`}
          className="input w-full"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@email.com"
        />
      </div>
      {showMessage && (
        <div>
          <label className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1 block" htmlFor={`message-${intent}`}>
            MESSAGE
          </label>
          <textarea
            id={`message-${intent}`}
            className="input w-full min-h-28"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-[#E8A0B8]">{error}</p>}
      <button type="submit" className="btn btn-gold w-full py-3" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : submitLabel}
      </button>
      <p className="text-[11px] text-[#7A6B5F] tracking-wide text-center">
        We’ll email this address. Nothing is charged here.
      </p>
    </form>
  )
}
