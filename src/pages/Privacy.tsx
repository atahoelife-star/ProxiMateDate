import { PageShell } from '../components/PageShell'

export function PrivacyPage() {
  return (
    <PageShell kicker="PRIVACY" title="Privacy Policy">
      <p>Last updated August 27, 2026. ProxiMateDate is a long-distance date-night website operated by A Tahoe Life / Gregory Barrett (atahoelife@gmail.com).</p>
      <h2 className="text-[#F8F4ED] text-xl">What we collect today</h2>
      <p>
        Today we collect email (and optional name or message) if you submit Sign In, Get Started, Contact, or a waitlist form. That form is sent through FormSubmit to atahoelife@gmail.com with the subject “ProxiMateDate waitlist.” We do not collect passwords, raw payment cards, or webcam video. If you pay a one-time date, Stripe Checkout (on stripe.com) processes the card; we do not see or store the number.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">What stays in your browser</h2>
      <p>
        Date-room chat, restaurant orders, and waiter/movie choices are local demo state. They are not stored on our servers. Opening one menu does not send the other person’s order anywhere.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">When accounts exist</h2>
      <p>
        If we add sign-in later, we would expect to collect an email, a display name, and the messages or date-room activity you choose to save. Live video, if we ever offer it, would be processed only to connect the two of you. We will update this page before that happens. We will not sell your list.
      </p>
      <h2 className="text-[#F8F4ED] text-xl">Third parties</h2>
      <p>
        FormSubmit delivers waitlist mail. Stripe processes optional Checkout payments when configured. YouTube may load if you start watch-together. Netflix is not embedded. Hosting is on Vercel. Stock waiter clips are stored on this site.
      </p>
      <p>Questions: atahoelife@gmail.com.</p>
    </PageShell>
  )
}
