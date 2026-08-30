import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const { pathname, hash } = useLocation()
  const immersive = pathname === '/restaurant' || pathname === '/movie-night' || pathname === '/date-night'

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])

  return (
    <div className="min-h-screen bg-[#0F0A0D] text-[#EDE4D9] overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {!immersive && <Footer />}
    </div>
  )
}
