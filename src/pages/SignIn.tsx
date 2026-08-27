import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function SignInPage() {
  return (
    <PageShell kicker="SIGN IN" title="Leave your email">
      <p>
        There is no account system yet — no password, no magic link that actually logs you in, and no toast that pretends you returned. If you want to be here when Sign In is real, leave an email. Same list as Get Started.
      </p>
      <div className="card p-6 mt-4">
        <WaitlistForm
          intent="signin"
          submitLabel="Save my email"
          description="We’ll write when you can sign in. Until then this is only a waitlist."
        />
      </div>
      <p className="text-sm text-[#A8988A]">
        New here? <Link to="/get-started" className="text-[#C9A962] underline">Get Started</Link> uses the same form.
      </p>
    </PageShell>
  )
}
