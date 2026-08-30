type HostRibbonProps = {
  show: boolean
}

/** Quiet host-only corner mark. Sits under the site nav, not on the timer or chat. */
export function HostRibbon({ show }: HostRibbonProps) {
  if (!show) return null
  return (
    <div
      className="pointer-events-none fixed left-3 z-40 top-24 px-3 py-1.5 text-[10px] tracking-[2px] rounded-full bg-[#0F0A0D]/90 border border-[#C9A962]/50 text-[#C9A962]"
      role="status"
    >
      You’re the host
    </div>
  )
}
