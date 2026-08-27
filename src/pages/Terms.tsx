import { PageShell } from '../components/PageShell'
import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <PageShell kicker="TERMS" title="Terms of Use">
      <p>Last updated August 27, 2026. By using proximatedate.com you agree to these terms.</p>
      <h2 className="text-[#F8F4ED] text-xl">What this site is</h2>
      <p>
        ProxiMateDate is a website preview of a long-distance date night. The Date Room is a demo: stock portraits, simulated chat, local restaurant orders, and waiter serving videos. It is not a live two-person call, not a reservation at The Verdant Ember or The Silver Sage Steakhouse, and not a paid booking.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Waitlist, not checkout</h2>
      <p>
        Paid prices on <Link to="/pricing" className="text-[#C9A962] underline">Pricing</Link> are planned amounts. Submitting an email does not charge you and does not create an account. Do not enter card numbers on this site — we do not ask for them.
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
