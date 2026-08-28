import { PageShell } from '../components/PageShell'
import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <PageShell kicker="TERMS" title="Terms of Use">
      <p>Last updated August 27, 2026. By using proximatedate.com you agree to these terms.</p>
      <h2 className="text-[#F8F4ED] text-xl">What this site is</h2>
      <p>
        ProxiMateDate is a website preview of a long-distance date night. The rooms are demos: simulated chat, local restaurant orders, waiter serving videos, and YouTube Watch Together. They are not a live two-person call, not a reservation at The Verdant Ember or The Silver Sage Steakhouse, and not a paid booking.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Waitlist and Checkout</h2>
      <p>
        The three rooms are free. Paid prices on <Link to="/pricing" className="text-[#C9A962] underline">Pricing</Link> are one-time amounts charged only through Stripe Checkout when a secret key is configured. Submitting an email does not charge you and does not create an account. Do not enter card numbers on this site — we do not host a card form.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Your use</h2>
      <p>
        Use the site lawfully. Do not attempt to disrupt it or scrape personal data. YouTube videos play under YouTube’s terms. Netflix companion mode requires your own Netflix subscription; we do not provide Netflix content.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">No warranty</h2>
      <p>
        The preview is offered as-is. We are not liable for missed dates, kitchen orders that never existed, or third-party outages. Contact atahoelife@gmail.com with concerns.
      </p>
    </PageShell>
  )
}
