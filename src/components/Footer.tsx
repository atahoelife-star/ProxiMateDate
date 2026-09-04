import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FeedbackForm } from './FeedbackForm'

const footerLinks = [
  { to: '/restaurant', label: 'Restaurant' },
  { to: '/movie-night', label: 'Movie Night' },
  { to: '/date-night', label: 'Date Night' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export function Footer() {
  const [open, setOpen] = useState(false)

  return (
    <footer className="border-t border-[#3A2F36] py-10 px-6 text-sm text-[#7A6B5F]">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-[#EDE4D9] transition">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-center">
          Made with love for couples everywhere • ProxiMateDate © {new Date().getFullYear()}
          <span className="block mt-1">
            <a href="mailto:atahoelife@gmail.com" className="hover:text-[#EDE4D9] transition">
              atahoelife@gmail.com
            </a>
            <span aria-hidden="true"> · </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="hover:text-[#EDE4D9] transition underline-offset-2 hover:underline"
            >
              Feedback
            </button>
          </span>
        </p>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8 text-[#EDE4D9]"
            role="dialog"
            aria-labelledby="date-feedback-title"
            onClick={(event) => event.stopPropagation()}
          >
            <FeedbackForm
              room="site"
              source="footer"
              showRoomPicker
              title="How was it?"
              body="Loved it, just ok, or confusing — plus a note if you want. No account needed."
              submitLabel="Send"
              skipLabel="Close"
              onDone={() => setOpen(false)}
              onSkip={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </footer>
  )
}
