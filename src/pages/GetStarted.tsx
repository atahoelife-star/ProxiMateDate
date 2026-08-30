import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>
        Get Started does not create an account.{' '}
        <Link to="/date-night" className="text-[#C9A962] underline">
          Free Date Night
        </Link>{' '}
        is open for 30 minutes with no card (the host can extend for $2.99). Dinner and movie night on{' '}
        <Link to="/pricing" className="text-[#C9A962] underline">
          Pricing
        </Link>{' '}
        use Stripe Checkout when a secret key is configured — this page never asks for a card.
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
