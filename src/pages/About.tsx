import { PageShell } from '../components/PageShell'
import { LIST_PRICE } from '../data/prices'

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
        Restaurant is {LIST_PRICE.dinner} for 90 minutes after you sit. Movie Night is {LIST_PRICE.movie} for 2.5 hours. Both start after you pay with a card on Stripe. Premium is {LIST_PRICE.premium} for 3 hours covering both. The first paid evening in this browser is 50% off. Netflix stays on your own apps.
      </p>
      <p>
        Leave your email on Sign In or Get Started if you’d like a note from us.
      </p>
    </PageShell>
  )
}
