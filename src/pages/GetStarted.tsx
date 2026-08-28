import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>
        Get Started does not create an account. The three date rooms are free. Paid one-time dates on{' '}
        <Link to="/pricing" className="text-[#C9A962] underline">
          Pricing
        </Link>{' '}
        use Stripe Checkout when a secret key is configured — this page never asks for a card. You can still{' '}
        <Link to="/date-room" className="text-[#C9A962] underline">
          pick a room
        </Link>{' '}
        right now.
      </p>
      <div className="card p-6 mt-4">
        <WaitlistForm
          intent="get-started"
          submitLabel="Join the waitlist"
          description="Subject line: ProxiMateDate waitlist. No credit card."
        />
      </div>
    </PageShell>
  )
}
