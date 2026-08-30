import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Heart, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/#how-it-works', label: 'How it works', end: false },
  { to: '/date-night', label: 'Free Date Night', end: false },
  { to: '/date-room', label: 'Dates', end: false },
  { to: '/pricing', label: 'Pricing', end: false },
]

function isDatesPath(pathname: string) {
  return ['/date-room', '/restaurant', '/movie-night'].includes(pathname)
}

function linkClass(isActive: boolean) {
  return `nav-link ${isActive ? 'active' : ''}`
}

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <nav className="sticky top-0 z-50 border-b border-[#3A2F36] bg-[#0F0A0D]/95 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 group min-w-0" onClick={close}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8A0B8] via-[#C9A962] to-[#E8A0B8] flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-[#0F0A0D]" />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-xl sm:text-2xl tracking-tight">ProxiMateDate</div>
            <div className="text-[10px] text-[#A8988A] -mt-1.5">FOR COUPLES IN LOVE</div>
          </div>
        </Link>

        <div className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                linkClass(
                  item.to.startsWith('/#')
                    ? location.hash === '#how-it-works' && location.pathname === '/'
                    : item.to === '/date-room'
                      ? isDatesPath(location.pathname)
                      : isActive,
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-3">
          <Link to="/signin" className="btn btn-ghost text-sm px-5 py-2">
            Sign In
          </Link>
          <Link to="/get-started" className="btn btn-gold text-sm px-6 py-2">
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="xl:hidden btn btn-ghost px-3 py-2"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="xl:hidden border-t border-[#3A2F36] bg-[#0F0A0D]">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={close}
              className={({ isActive }) =>
                `nav-link text-left w-full py-3 ${
                  item.to.startsWith('/#')
                    ? location.hash === '#how-it-works' && location.pathname === '/'
                      ? 'active'
                      : ''
                    : item.to === '/date-room'
                      ? isDatesPath(location.pathname)
                        ? 'active'
                        : ''
                      : isActive
                        ? 'active'
                        : ''
                }`
              }
            >
                {item.label}
              </NavLink>
            ))}
            <Link to="/signin" className="nav-link py-3" onClick={close}>
              Sign In
            </Link>
            <Link to="/get-started" className="btn btn-gold mt-2 w-full py-3" onClick={close}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
