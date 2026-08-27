import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function GetStartedPage() {
  return (
    <PageShell kicker="GET STARTED" title="Join ProxiMateDate">
      <p>
        Get Started does not jump to a fake checkout. It does not create a session. Tell us your email and we’ll invite you when the paid date night — and real sign-in — exist. You can still{' '}
        <Link to="/date-room" className="text-[#C9A962] underline">
          open the date-room preview
        </Link>{' '}
        right now, including both restaurant menus.
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
