import { Link } from 'react-router-dom'
import { GATES_STILL, PARK_NAME, PARK_TAGLINE } from '../../data/carnival'

type CarnivalPreviewGateProps = {
  onEnter: () => void
}

export function CarnivalPreviewGate({ onEnter }: CarnivalPreviewGateProps) {
  return (
    <div
      className="min-h-[calc(100vh-80px)] relative flex items-center justify-center px-6 py-16"
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.62), rgba(15,10,13,0.86)), url('${GATES_STILL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 max-w-lg w-full card p-8 md:p-10 text-center">
        <div className="text-[#C9A962] text-xs tracking-[3px] mb-3">PREVIEW · NO CHARGE</div>
        <h1 className="text-[#F8F4ED] text-3xl mb-3">{PARK_NAME}</h1>
        <p className="text-[#A8988A] leading-relaxed mb-6">{PARK_TAGLINE}. This room is unpaid QA — no Stripe, no checkout.</p>
        <button type="button" onClick={onEnter} className="btn btn-gold w-full py-3">
          Enter preview
        </button>
        <p className="text-[#7A6B5F] text-xs mt-4 leading-relaxed">
          Same as opening <code className="text-[#C9A962]">/carnival?paid=1</code>. Guests join with the invite link.
        </p>
        <Link to="/" className="btn btn-ghost mt-4 w-full py-3 border border-white/15">
          Back home
        </Link>
      </div>
    </div>
  )
}
