import { useEffect, useRef } from 'react'
import { MIN_SERVICE_MS, WAITER_CLIPS, type WaiterClip } from '../../data/waiterClips'

export type IdleBackdrop = {
  src: string
  kind: 'image' | 'video'
}

type WaiterVideoTileProps = {
  clip: WaiterClip
  serving: boolean
  playId: number
  onServiceEnded: (clip: WaiterClip) => void
  idleBackdrop?: IdleBackdrop
}

export function WaiterVideoTile({ clip, serving, playId, onServiceEnded, idleBackdrop }: WaiterVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onEndedRef = useRef(onServiceEnded)
  const spec = WAITER_CLIPS[clip]
  const showChosenRoom = Boolean(idleBackdrop) && !serving
  const caption = serving ? spec.label : idleBackdrop ? 'Your table' : spec.presenceLabel
  // Never play waiter-idle or the walk-in door clip as the seated room.
  const seatedVideo =
    !serving &&
    idleBackdrop?.kind === 'video' &&
    !idleBackdrop.src.includes('waiter-idle') &&
    !idleBackdrop.src.includes('restaurant-walk-in')
      ? idleBackdrop.src
      : null
  const videoSrc = serving ? spec.src : seatedVideo

  useEffect(() => {
    onEndedRef.current = onServiceEnded
  }, [onServiceEnded])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !videoSrc) return
    const srcChanged = el.getAttribute('src') !== videoSrc
    if (srcChanged) {
      el.src = videoSrc
    }
    el.loop = true
    el.muted = true
    el.playsInline = true
    el.playbackRate = 1
    el.defaultPlaybackRate = 1
    if (srcChanged || serving) {
      el.currentTime = 0
    }
    el.play().catch(() => {
      /* Autoplay can wait until the tile is in view; muted should still succeed. */
    })
  }, [videoSrc, serving, playId])

  useEffect(() => {
    if (!serving) return
    const held = clip
    const timer = window.setTimeout(() => {
      onEndedRef.current(held)
    }, MIN_SERVICE_MS)
    return () => window.clearTimeout(timer)
  }, [serving, playId, clip])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-[#C9A962] text-xs tracking-[2.5px]">{serving ? 'WAITER' : 'DINING ROOM'}</div>
        <div className="text-[#A8988A] text-xs">{caption}</div>
      </div>
      <div className="video-frame video-frame-live flex-1">
        {showChosenRoom && (idleBackdrop?.kind === 'image' || !seatedVideo) && idleBackdrop ? (
          <img src={idleBackdrop.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            autoPlay
            loop
            onEnded={(event) => {
              const el = event.currentTarget
              el.currentTime = 0
              el.play().catch(() => {})
            }}
          />
        ) : null}
        <div className="overlay pointer-events-none" />
        {serving && (
          <>
            <div className="video-label">
              <div className="live-dot" /> WAITER
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">
              LIVE
            </div>
          </>
        )}
      </div>
    </div>
  )
}
