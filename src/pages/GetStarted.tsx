import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'
import { LandingDemo, LandingDemoCtas } from '../components/LandingDemo'
import { LIST_PRICE } from '../data/prices'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>A look at dinner and movie night. No sign-in.</p>
      <LandingDemo className="my-6" />
      <div className="mb-8">
        <LandingDemoCtas size="md" />
      </div>
      <p>
        <Link to="/date-night" className="text-[#C9A962] underline">
          Free Date Night
        </Link>{' '}
        is 30 minutes. The host can extend for $2.99.
      </p>
      <p>
        Dinner is {LIST_PRICE.dinner}
        <br />
        for 90 minutes.
        <br />
        Movie night is {LIST_PRICE.movie}
        <br />
        for 2.5 hours. Pay with a card on Stripe — see{' '}
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
