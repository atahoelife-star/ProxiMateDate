import { PageShell } from '../components/PageShell'
import { WaitlistForm } from '../components/WaitlistForm'

export function ContactPage() {
  return (
    <PageShell kicker="WRITE TO US" title="Contact">
      <p>
        Email{' '}
        <a className="text-[#C9A962] underline" href="mailto:atahoelife@gmail.com">
          atahoelife@gmail.com
        </a>
        . You can also leave a note below. It goes to the same inbox.
      </p>
      <div className="card p-6 mt-6">
        <WaitlistForm
          intent="contact"
          showMessage
          submitLabel="Send"
          heading="Send a note"
          description="Questions about the rooms or the two Silver Springs menus are welcome."
        />
      </div>
    </PageShell>
  )
}
