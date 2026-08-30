import { PageShell } from '../components/PageShell'

export function TermsPage() {
  return (
    <PageShell kicker="TERMS" title="Terms of Use">
      <p>Last updated August 27, 2026. By using proximatedate.com you agree to these terms.</p>
      <h2 className="text-[#F8F4ED] text-xl">What this site is</h2>
      <p>
        ProxiMateDate is a website preview of a long-distance date night. The rooms are demos: simulated chat, local restaurant orders, waiter serving videos, and YouTube Watch Together. They are not a live two-person call and not a reservation at The Verdant Ember or The Silver Sage Steakhouse. Dinner and Movie Night are paid before those rooms start.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Waitlist and Checkout</h2>
      <p>
        Free Date Night is free for 30 minutes; the host may extend for $2.99. Dinner ($9.99, 90 minutes after you sit) and Movie Night ($14.99, 2.5 hours) are paid before those rooms start, through Stripe Checkout when a secret key is configured. Premium ($24.99) covers both rooms for 3 hours. Submitting an email does not charge you and does not create an account. Do not enter card numbers on this site — we do not host a card form. We do not send you to PayPal, Venmo, or Cash App.
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
