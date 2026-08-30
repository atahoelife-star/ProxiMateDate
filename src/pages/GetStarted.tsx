import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>
        <Link to="/date-night" className="text-[#C9A962] underline">
          Free Date Night
        </Link>{' '}
        is 30 minutes. The host can extend for $2.99. Dinner is $9.99 for 90 minutes. Movie night is $14.99 for 2.5 hours. Pay with a card on Stripe — see{' '}
        <Link to="/pricing" className="text-[#C9A962] underline">
          Pricing
        </Link>
        .
      </p>
      <div className="card p-6 mt-4">
        <WaitlistForm
          intent="get-started"
          submitLabel="Leave my email"
          description="Leave your email and we’ll send a note from us."
        />
      </div>
    </PageShell>
  )
}
