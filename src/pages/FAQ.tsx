import { PageShell } from '../components/PageShell'
import { Link } from 'react-router-dom'

export function FaqPage() {
  return (
    <PageShell kicker="ANSWERS" title="FAQ">
      <h2 className="text-[#F8F4ED] text-xl">Is the Date Room a live video call?</h2>
      <p>
        No. The waiter tile is a live serving clip (not a webcam). There is no partner video box and no WebRTC two-person call in this version.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Can we order from two restaurants?</h2>
      <p>
        Yes. In one date-room session each person picks a restaurant independently. Mixed tables (vegan + steakhouse) are the point. Shared “for two” dishes go on the table order. Nothing is sent to a kitchen; orders stay in your browser.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Do you take payment?</h2>
      <p>
        The Date Room is free. Paid one-time amounts ($9.99 / $14.99 / $24.99) open Stripe Checkout when a <code className="text-[#C9A962]">STRIPE_SECRET_KEY</code> is set on Vercel. If that key is missing, Pricing collects a waitlist email instead. We never ask for raw card numbers on this website. See <Link to="/pricing" className="text-[#C9A962] underline">Pricing</Link>.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">How do Sign In and Get Started work?</h2>
      <p>
        They collect an email for the waitlist (FormSubmit to atahoelife@gmail.com). That is not an account. There is no magic login yet and no “you’re signed in” toast.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">YouTube and Netflix?</h2>
      <p>
        YouTube watch-together uses Google’s official IFrame Player (youtube.com/iframe_api). Paste a link, then press Play. Play, pause, seek, and mute control the movie when it can embed. If a video cannot play in the page, Play becomes Watch on YouTube and opens that same video. Copy a follower link (<code className="text-[#C9A962]">?room=&watch=&follow=1</code>) for a second tab on this computer. Lockstep across two different phones needs a realtime server we have not added yet.
      </p>
      <p>
        Netflix, Hulu, Disney+, and Prime Video are companion-only: a countdown and this date room. We do not embed or proxy those catalogs.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Is there an app?</h2>
      <p>This is a website only. Apple/Google apps and in-app purchases are not part of this release.</p>
    </PageShell>
  )
}
