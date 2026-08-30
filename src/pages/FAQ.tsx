import { PageShell } from '../components/PageShell'
import { Link } from 'react-router-dom'

export function FaqPage() {
  return (
    <PageShell kicker="ANSWERS" title="FAQ">
      <h2 className="text-[#F8F4ED] text-xl">Are the rooms live video calls?</h2>
      <p>
        No. The restaurant waiter tile is a live serving clip (not a webcam). There is no partner video box and no live two-person video call.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">What are the three rooms?</h2>
      <p>
        <Link to="/restaurant" className="text-[#C9A962] underline">Restaurant</Link> is $9.99 for 90 minutes once you sit.{' '}
        <Link to="/movie-night" className="text-[#C9A962] underline">Movie night</Link> is $14.99 for 2.5 hours.{' '}
        <Link to="/date-night" className="text-[#C9A962] underline">Free date night</Link> is simple chat — free for 30 minutes. The host can extend for $2.99; the guest is not billed.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Can we order from two restaurants?</h2>
      <p>
        Yes — in the restaurant room. Each person picks a kitchen independently. Mixed tables (vegan + steakhouse) are the point. Shared “for two” dishes go on the table order. Nothing is sent to a kitchen; orders stay in your browser.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Do you take payment?</h2>
      <p>
        Free Date Night is free for 30 minutes. About three minutes before it ends, the host (not the guest) can pay $2.99 on Stripe to extend.
      </p>
      <p>Dinner is $9.99 for 90 minutes after you sit.</p>
      <p>Movie Night is $14.99 for 2.5 hours. Both are paid before those rooms start.</p>
      <p>
        Premium is $24.99 for 3 hours covering both. Pay with a card on Stripe. We do not send you to PayPal, Venmo, or Cash App. See <Link to="/pricing" className="text-[#C9A962] underline">Pricing</Link>.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">How do Sign In and Get Started work?</h2>
      <p>
        Leave an email on Sign In or Get Started. We’ll write back. That’s not a password login yet.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">YouTube and Netflix?</h2>
      <p>
        YouTube Watch Together lives on movie night and uses Google’s official player. Paste a link, then press Play. Play, pause, seek, and mute control the movie when it can play in the page. If it cannot, Play becomes Watch on YouTube and opens that same video. Copy a follower link for a second tab on this computer. Watch Together on two different phones is not synced yet.
      </p>
      <p>
        Netflix, Hulu, Disney+, and Prime Video are companion-only: a countdown and this site. We do not embed or proxy those catalogs. We do not bypass YouTube age-restriction.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Is there an app?</h2>
      <p>This is a website only.</p>
    </PageShell>
  )
}
