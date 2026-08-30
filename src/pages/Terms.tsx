import { PageShell } from '../components/PageShell'

export function TermsPage() {
  return (
    <PageShell kicker="TERMS" title="Terms of Use">
      <p>Last updated August 27, 2026. By using proximatedate.com you agree to these terms.</p>
      <h2 className="text-[#F8F4ED] text-xl">What this site is</h2>
      <p>
        ProxiMateDate is a website for a long-distance date night. Chat is between the two of you on a room link. Restaurant orders stay in your browser. Waiter clips are videos. YouTube Watch Together uses YouTube. This is not a live two-person video call and not a reservation at The Verdant Ember or The Silver Sage Steakhouse. Dinner and Movie Night are paid before those rooms start.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Waitlist and Checkout</h2>
      <p>
        Free Date Night is free for 30 minutes; the host may extend for $2.99. Dinner is $9.99 for 90 minutes after you sit. Movie Night is $14.99 for 2.5 hours. Both are paid before those rooms start through Stripe. Premium is $24.99 for 3 hours covering both. Submitting an email does not charge you. Paid rooms are billed through Stripe. We do not send you to PayPal, Venmo, or Cash App.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Your use</h2>
      <p>
        Use the site lawfully. Do not attempt to disrupt it or scrape personal data. YouTube videos play under YouTube’s terms. Netflix companion mode requires your own Netflix subscription; we do not provide Netflix content.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">No warranty</h2>
      <p>
        The site is offered as-is. We are not liable for missed dates, kitchen orders that never existed, or third-party outages. Contact atahoelife@gmail.com with concerns.
      </p>
    </PageShell>
  )
}
