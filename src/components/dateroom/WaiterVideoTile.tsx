import { useEffect, useRef } from 'react'
import { WAITER_CLIPS, type WaiterClip } from '../../data/waiterClips'

type WaiterVideoTileProps = {
  clip: WaiterClip
  onServiceEnded: () => void
}

export function WaiterVideoTile({ clip, onServiceEnded }: WaiterVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const spec = WAITER_CLIPS[clip]

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.src = spec.src
    el.loop = spec.loop
    el.muted = true
    el.playsInline = true
    const play = () => {
      el.play().catch(() => {
        /* Autoplay can wait until the tile is in view; muted should still succeed. */
      })
    }
    play()
  }, [spec.src, spec.loop, clip])

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-[#C9A962] text-xs tracking-[2.5px]">WAITER</div>
        <div className="text-[#A8988A] text-xs">{spec.label}</div>
      </div>
      <div className="video-frame">
        <video
          key={spec.src + clip}
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
          loop={spec.loop}
          onEnded={() => {
            if (!spec.loop) onServiceEnded()
          }}
        />
        <div className="overlay pointer-events-none" />
        <div className="video-label">
          <div className="live-dot" /> WAITER
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">
          LIVE
        </div>
      </div>
    </div>
  )
}
