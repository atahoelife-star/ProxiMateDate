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
      <p>
        This is a browser product (desktop and mobile web). There is no iOS or Android app in this release, and there is no in-app purchase. The date room you can open today is a preview: a live waiter serving clip, local demo chat, YouTube watch-together, and a Netflix companion mode that does not embed Netflix.
      </p>
      <p>
        If you want the real product when accounts exist, leave your email on Sign In or Get Started. We will not invent a couple count or publish quotes we did not receive.
      </p>
    </PageShell>
  )
}
