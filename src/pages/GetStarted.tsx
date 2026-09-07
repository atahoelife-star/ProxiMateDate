import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'
import { LandingDemo, LandingDemoCtas } from '../components/LandingDemo'
import { LIST_PRICE } from '../data/prices'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>A look at dinner and movie night. No sign-in. Start free, or leave your email.</p>
      <LandingDemo className="my-6" />
      <div className="mb-8">
        <LandingDemoCtas size="md" kind="rooms" />
      </div>
      <p>
        <Link to="/date-night" className="text-[#C9A962] underline">
          Free Date Night
        </Link>{' '}
        is 30 minutes. No card to start. The host can extend for $2.99.
      </p>
      <p className="text-[#7A6B5F] text-sm">
        Dinner {LIST_PRICE.dinner} for 90 minutes. Movie night {LIST_PRICE.movie} for 2.5 hours. See{' '}
        <Link to="/pricing" className="text-[#A8988A] underline">
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
