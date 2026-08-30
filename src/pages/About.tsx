import { PageShell } from '../components/PageShell'

export function AboutPage() {
  return (
    <PageShell kicker="A TAHOE LIFE" title="About ProxiMateDate">
      <p>
        ProxiMateDate is a website for long-distance date nights. It is made by A Tahoe Life / Gregory Barrett
        (<a className="text-[#C9A962] underline" href="mailto:atahoelife@gmail.com">atahoelife@gmail.com</a>).
      </p>
      <p>
        The idea is simple: sit at one virtual table even if you want different restaurants. One of you can order from The Verdant Ember (vegan, Silver Springs, Nevada). The other can order from The Silver Sage Steakhouse. Shared plates — the cauliflower centerpiece, the tomahawk — belong to the table.
      </p>
      <p>This is a website (desktop and mobile). There is no iOS or Android app.</p>
      <p>Free Date Night is open for 30 minutes. The host can extend for $2.99.</p>
      <p>
        Restaurant is $9.99 for 90 minutes after you sit. Movie Night is $14.99 for 2.5 hours. Both start after you pay with a card on Stripe. Premium is $24.99 for 3 hours covering both. Netflix stays on your own apps.
      </p>
      <p>
        Leave your email on Sign In or Get Started if you’d like a note from us.
      </p>
    </PageShell>
  )
}
