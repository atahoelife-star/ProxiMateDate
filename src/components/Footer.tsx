import { Link } from 'react-router-dom'

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
          <span className="block mt-1">atahoelife@gmail.com</span>
        </p>
      </div>
    </footer>
  )
}
