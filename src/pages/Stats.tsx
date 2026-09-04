import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchPrivateStats,
  readStoredStatsKey,
  storeStatsKey,
  stripStatsKeyFromAddress,
  type StatsPayload,
} from '../lib/privateStats'
import { ratingLabel, roomLabel } from '../lib/feedback'

function formatWhen(at: number) {
  if (!at) return '—'
  try {
    return new Date(at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function countOrDash(available: boolean, value: number | undefined) {
  if (!available || typeof value !== 'number') return '—'
  return String(value)
}

export function StatsPage() {
  const [keyDraft, setKeyDraft] = useState('')
  const [status, setStatus] = useState<'locked' | 'loading' | 'ready' | 'denied' | 'unset'>('locked')
  const [data, setData] = useState<StatsPayload | null>(null)

  useEffect(() => {
    document.title = 'Private counts'
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta')
    robots.setAttribute('name', 'robots')
    robots.setAttribute('content', 'noindex, nofollow, noarchive')
    if (!robots.parentNode) document.head.appendChild(robots)
    return () => {
      robots.setAttribute('content', 'index, follow')
    }
  }, [])

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('key') || ''
    const stored = readStoredStatsKey()
    const key = fromQuery || stored
    if (fromQuery) {
      storeStatsKey(fromQuery)
      stripStatsKeyFromAddress()
    }
    if (!key) return
    let cancelled = false
    setStatus('loading')
    void fetchPrivateStats(key).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setData(result.data)
        setStatus('ready')
        return
      }
      storeStatsKey('')
      setData(null)
      setStatus(result.status === 503 ? 'unset' : result.status === 401 ? 'denied' : 'locked')
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    if (window.location.pathname !== '/stats/feedback') return
    document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [status])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const key = keyDraft.trim()
    if (!key) return
    storeStatsKey(key)
    stripStatsKeyFromAddress()
    setStatus('loading')
    void fetchPrivateStats(key).then((result) => {
      if (result.ok) {
        setData(result.data)
        setStatus('ready')
        setKeyDraft('')
        return
      }
      storeStatsKey('')
      setData(null)
      setStatus(result.status === 503 ? 'unset' : result.status === 401 ? 'denied' : 'locked')
    })
  }

  const stripe = data?.stripe
  const starts = data?.roomStarts

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">PRIVATE</div>
      <h1 className="text-[#F8F4ED] mb-4">Evening counts</h1>
      <p className="text-[#A8988A] leading-relaxed mb-8">
        This page is private. It is not listed on the public site. Numbers here are only what this
        website actually recorded.
      </p>

      {status !== 'ready' && (
        <form onSubmit={onSubmit} className="space-y-4">
          {status === 'denied' && <p className="text-[#E8A0B8]">That password did not match.</p>}
          {status === 'unset' && (
            <p className="text-[#E8A0B8]">The private lock is not set on this server yet.</p>
          )}
          {status === 'locked' && <p>Enter the private password to see counts.</p>}
          {status === 'loading' && <p>Loading recorded counts…</p>}
          <label className="block">
            <span className="sr-only">Private password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              className="w-full rounded-lg bg-[#1A1216] border border-[#3A2F36] px-4 py-3 text-[#F8F4ED]"
            />
          </label>
          <button type="submit" className="btn btn-gold px-6 py-2">
            Open
          </button>
        </form>
      )}

      {status === 'ready' && starts && stripe && (
        <div className="space-y-8">
          <section>
            <h2 className="text-[#C9A962] text-sm tracking-[2px] mb-4">ROOM STARTS</h2>
            <p className="text-[#A8988A] text-sm mb-4">
              One count per unique room. Two people in the same room count as one start. Free Date
              Night never reaches Stripe unless someone pays $2.99 to extend.
            </p>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-[#3A2F36] py-2">
                <dt>Free Date Night starts</dt>
                <dd className="text-[#F8F4ED]">{starts.free}</dd>
              </div>
              <div className="flex justify-between border-b border-[#3A2F36] py-2">
                <dt>Dinner starts</dt>
                <dd className="text-[#F8F4ED]">{starts.dinner}</dd>
              </div>
              <div className="flex justify-between border-b border-[#3A2F36] py-2">
                <dt>Movie Night starts</dt>
                <dd className="text-[#F8F4ED]">{starts.movie}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-[#C9A962] text-sm tracking-[2px] mb-4">STRIPE CHECKOUT</h2>
            {stripe.available ? (
              <>
                <p className="text-[#A8988A] text-sm mb-4">
                  Paid Checkout sessions on the Stripe account tied to this server. A dash would
                  mean Stripe did not answer; these are recorded paid sessions.
                </p>
                {stripe.truncated && (
                  <p className="text-[#E8A0B8] text-sm mb-4">
                    Stripe returned more sessions than this page listed. These paid counts may be
                    low.
                  </p>
                )}
                <dl className="space-y-3">
                  <div className="flex justify-between border-b border-[#3A2F36] py-2">
                    <dt>Dinner $9.99</dt>
                    <dd className="text-[#F8F4ED]">{countOrDash(true, stripe.dinner)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[#3A2F36] py-2">
                    <dt>Movie Night $14.99</dt>
                    <dd className="text-[#F8F4ED]">{countOrDash(true, stripe.movie)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[#3A2F36] py-2">
                    <dt>Premium $24.99</dt>
                    <dd className="text-[#F8F4ED]">{countOrDash(true, stripe.premium)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[#3A2F36] py-2">
                    <dt>Extend $2.99</dt>
                    <dd className="text-[#F8F4ED]">{countOrDash(true, stripe.extend)}</dd>
                  </div>
                  {typeof stripe.other === 'number' && stripe.other > 0 && (
                    <div className="flex justify-between border-b border-[#3A2F36] py-2">
                      <dt>Other paid checkouts</dt>
                      <dd className="text-[#F8F4ED]">{stripe.other}</dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <p className="text-[#A8988A]">
                Paid Stripe counts are not available on this server. Room starts above are still
                the recorded totals. No paid numbers are shown as zero.
              </p>
            )}
          </section>

          <section id="feedback">
            <h2 className="text-[#C9A962] text-sm tracking-[2px] mb-4">RECENT FEEDBACK</h2>
            <p className="text-[#A8988A] text-sm mb-4">
              Private notes from ended dates and the footer form. Not shown on the public site.
            </p>
            {data.feedback.length === 0 ? (
              <p className="text-[#A8988A]">No notes yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.feedback.map((row) => (
                  <li key={row.id} className="border-b border-[#3A2F36] pb-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-[#F8F4ED]">{ratingLabel(row.rating)}</span>
                      <span className="text-[#7A6B5F]">{formatWhen(row.at)}</span>
                    </div>
                    <p className="text-[#A8988A] text-sm mt-1">
                      {roomLabel(row.room)}
                      {row.plan ? ` · ${row.plan}` : ''}
                      {row.source ? ` · ${row.source}` : ''}
                    </p>
                    {row.note ? <p className="text-[#EDE4D9] text-sm mt-2 whitespace-pre-wrap">{row.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-[#7A6B5F] text-sm">
            Room starts and feedback live on this website’s server and can reset if the host moves
            machines. Stripe numbers come from Checkout when that secret is present.
          </p>
        </div>
      )}
    </div>
  )
}
