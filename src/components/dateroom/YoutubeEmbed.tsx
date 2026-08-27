import { useEffect, useRef } from 'react'
import { loadYouTubeIframeApi, type YTPlayerHandle } from '../../lib/youtube'

type YoutubeEmbedProps = {
  videoId: string
  role: 'host' | 'follower'
  muted: boolean
  onReady?: (player: YTPlayerHandle) => void
  onHostState?: (playing: boolean, time: number) => void
  onError?: () => void
}

export function YoutubeEmbed({ videoId, role, muted, onReady, onHostState, onError }: YoutubeEmbedProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayerHandle | null>(null)
  const onReadyRef = useRef(onReady)
  const onHostStateRef = useRef(onHostState)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onReadyRef.current = onReady
    onHostStateRef.current = onHostState
    onErrorRef.current = onError
  }, [onReady, onHostState, onError])

  useEffect(() => {
    const mount = hostRef.current
    if (!mount) return
    let cancelled = false
    let player: YTPlayerHandle | null = null

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT?.Player) return
      const target = document.createElement('div')
      hostRef.current.innerHTML = ''
      hostRef.current.appendChild(target)
      player = new window.YT.Player(target, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: role === 'host' ? 1 : 0,
          disablekb: role === 'follower' ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
          enablejsapi: 1,
          mute: muted || role === 'follower' ? 1 : 0,
        },
        events: {
          onReady: (event: { target: YTPlayerHandle }) => {
            playerRef.current = event.target
            if (muted || role === 'follower') event.target.mute()
            else event.target.unMute()
            onReadyRef.current?.(event.target)
          },
          onStateChange: (event: { data: number; target: YTPlayerHandle }) => {
            if (role !== 'host') return
            const playing = event.data === window.YT?.PlayerState.PLAYING
            const paused = event.data === window.YT?.PlayerState.PAUSED || event.data === window.YT?.PlayerState.ENDED
            if (!playing && !paused) return
            onHostStateRef.current?.(playing, event.target.getCurrentTime())
          },
          onError: () => {
            onErrorRef.current?.()
          },
        },
      } as never)
      playerRef.current = player
    })

    return () => {
      cancelled = true
      try {
        player?.destroy()
      } catch {
        /* already gone */
      }
      playerRef.current = null
      if (mount) mount.innerHTML = ''
    }
  }, [videoId, role, muted])

  return <div ref={hostRef} className="absolute inset-0 youtube-embed" />
}
