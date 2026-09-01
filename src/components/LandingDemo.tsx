import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function LandingDemoCtas({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const pad = size === 'lg' ? 'text-base px-10 py-4' : 'text-sm px-8 py-3'
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/date-night" className={`btn btn-gold ${pad}`}>
        Try it for free
      </Link>
      <Link to="/restaurant" className={`btn btn-outline ${pad}`}>
        Dinner
      </Link>
      <Link to="/movie-night" className={`btn btn-outline ${pad}`}>
        Movie
      </Link>
    </div>
  )
}

export function LandingDemo({ className = '' }: { className?: string }) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#C9A962]/35 bg-[#1A1418] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] ${className}`}
    >
      <div className="aspect-video">
        {reduceMotion ? (
          <img
            src="/images/landing-demo.jpg"
            alt="Restaurant doors into a dining room, a plate arriving, and movie-night popcorn"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            className="w-full h-full object-cover"
            src="/videos/landing-demo.mp4"
            poster="/images/landing-demo.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-label="A short look at the restaurant rooms, a meal arriving, and movie-night popcorn"
          />
        )}
      </div>
    </div>
  )
}
