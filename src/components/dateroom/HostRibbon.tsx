type HostRibbonProps = {
  show: boolean
}

/** Quiet host-only mark. Does not cover the timer or chat. */
export function HostRibbon({ show }: HostRibbonProps) {
  if (!show) return null
  return (
    <div className="pointer-events-none fixed bottom-4 left-3 z-40 px-3 py-1.5 text-[10px] tracking-[2px] rounded-full bg-[#0F0A0D]/85 border border-[#C9A962]/45 text-[#C9A962]">
      You’re the host
    </div>
  )
}
