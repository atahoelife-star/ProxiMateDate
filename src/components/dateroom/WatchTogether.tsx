import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Link as LinkIcon, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { YoutubeEmbed } from './YoutubeEmbed'
import {
  bootWatchState,
  emptyWatchState,
  expectedTime,
  subscribeWatchState,
  writeWatchState,
  type WatchState,
} from '../../lib/watchSync'
import { parseYouTubeId, ROMANTIC_TRAILERS, type YTPlayerHandle } from '../../lib/youtube'

type WatchStageProps = {
  roomId: string
  partnerName: string
  initialVideoId: string | null
  isFollower: boolean
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
  onRoomMessage: (text: string) => void
  youStill: React.ReactNode
  partnerStill: React.ReactNode
  waiterTile: React.ReactNode
}

export function WatchStage({
  roomId,
  partnerName,
  initialVideoId,
  isFollower,
  pickerOpen,
  onPickerOpenChange,
  onRoomMessage,
  youStill,
  partnerStill,
  waiterTile,
}: WatchStageProps) {
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<WatchState | null>(() => bootWatchState(roomId, initialVideoId, isFollower))
  const [duration, setDuration] = useState(0)
  const [displayTime, setDisplayTime] = useState(0)

  const hostRef = useRef<YTPlayerHandle | null>(null)
  const followRef = useRef<YTPlayerHandle | null>(null)
  const applying = useRef(false)
  const stateRef = useRef(state)
  const onRoomMessageRef = useRef(onRoomMessage)

  useEffect(() => {
    onRoomMessageRef.current = onRoomMessage
  }, [onRoomMessage])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (isFollower) return
    const current = stateRef.current
    if (!current) return
    writeWatchState(roomId, current)
  }, [roomId, isFollower])

  useEffect(() => {
    if (!state) return
    const next = new URL(window.location.href)
    next.searchParams.set('room', roomId)
    next.searchParams.set('watch', state.videoId)
    if (isFollower) next.searchParams.set('follow', '1')
    window.history.replaceState({}, '', `${next.pathname}${next.search}`)
  }, [roomId, state, isFollower])

  useEffect(() => {
    return subscribeWatchState(roomId, (incoming) => {
      const current = stateRef.current
      if (current && incoming.seq <= current.seq) return
      stateRef.current = incoming
      setState(incoming)
      applyToPlayer(followRef.current, incoming, true)
      if (isFollower) applyToPlayer(hostRef.current, incoming, true)
    })
  }, [roomId, isFollower])

  useEffect(() => {
    const id = window.setInterval(() => {
      const host = hostRef.current
      const current = stateRef.current
      if (!current) return
      if (host && !applying.current && !isFollower) {
        try {
          const time = host.getCurrentTime()
          setDisplayTime(time)
          const d = host.getDuration()
          if (d) setDuration(d)
          if (current.playing) {
            const written = writeWatchState(roomId, { ...current, time, at: Date.now(), playing: true })
            stateRef.current = written
          }
        } catch {
          /* player not ready */
        }
      } else {
        setDisplayTime(expectedTime(current))
      }
      applyToPlayer(followRef.current, current, true)
      if (isFollower) applyToPlayer(hostRef.current, current, true)
    }, 400)
    return () => window.clearInterval(id)
  }, [roomId, isFollower])

  const publish = (next: WatchState) => {
    if (isFollower) {
      stateRef.current = next
      setState(next)
      return
    }
    const written = writeWatchState(roomId, next)
    stateRef.current = written
    setState(written)
  }

  const startVideo = (raw: string, title?: string) => {
    const id = parseYouTubeId(raw)
    if (!id) {
      setError('Paste a youtube.com or youtu.be link (or an 11-character video ID).')
      return
    }
    setError('')
    hostRef.current = null
    followRef.current = null
    publish(emptyWatchState(id, title || 'YouTube'))
    onPickerOpenChange(false)
    onRoomMessageRef.current(
      `Watch together: ${title || id}. YOU is the host. ${partnerName}’s tile follows (muted on this screen so you hear one soundtrack).`,
    )
  }

  const stopWatching = () => {
    hostRef.current = null
    followRef.current = null
    setState(null)
    onPickerOpenChange(false)
    const next = new URL(window.location.href)
    next.searchParams.delete('watch')
    window.history.replaceState({}, '', `${next.pathname}${next.search}`)
  }

  const onHostState = (playing: boolean, time: number) => {
    if (applying.current || !stateRef.current) return
    publish({ ...stateRef.current, playing, time, at: Date.now() })
  }

  const togglePlay = () => {
    const host = hostRef.current
    const current = stateRef.current
    if (!current) return
    if (current.playing) {
      host?.pauseVideo()
      publish({ ...current, playing: false, time: host?.getCurrentTime() ?? current.time, at: Date.now() })
    } else {
      host?.playVideo()
      publish({ ...current, playing: true, time: host?.getCurrentTime() ?? current.time, at: Date.now() })
    }
  }

  const onSeek = (seconds: number) => {
    const current = stateRef.current
    if (!current) return
    applying.current = true
    hostRef.current?.seekTo(seconds, true)
    followRef.current?.seekTo(seconds, true)
    publish({ ...current, time: seconds, at: Date.now() })
    window.setTimeout(() => {
      applying.current = false
    }, 250)
  }

  const toggleMute = () => {
    const current = stateRef.current
    if (!current) return
    const muted = !current.muted
    if (muted) hostRef.current?.mute()
    else hostRef.current?.unMute()
    followRef.current?.mute()
    publish({ ...current, muted })
  }

  const copyRoomLink = () => {
    const url = new URL(`${window.location.origin}/date-room`)
    url.searchParams.set('room', roomId)
    url.searchParams.set('follow', '1')
    if (state?.videoId) url.searchParams.set('watch', state.videoId)
    navigator.clipboard.writeText(url.toString())
    toast.success('Follower room link copied', {
      description:
        'Open it in a second tab on this computer to follow this host. Two phones get the same YouTube video; device-to-device lockstep needs a realtime server we have not added yet.',
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {state ? (
          <>
            <WatchSeat
              heading={isFollower ? 'ME · FOLLOWS THE HOST' : 'ME · HOST'}
              label="YOU"
              videoId={state.videoId}
              role={isFollower ? 'follower' : 'host'}
              muted={state.muted || isFollower}
              onReady={(player) => {
                hostRef.current = player
                if (state.muted || isFollower) player.mute()
                if (isFollower) applyToPlayer(player, state, true)
              }}
              onHostState={isFollower ? undefined : onHostState}
              onError={setError}
            />
            <WatchSeat
              heading={isFollower ? `${partnerName.toUpperCase()} · ALSO FOLLOWS` : `${partnerName.toUpperCase()} · FOLLOWS YOU`}
              label={partnerName.toUpperCase()}
              videoId={state.videoId}
              role="follower"
              muted
              onReady={(player) => {
                followRef.current = player
                player.mute()
                applyToPlayer(player, state, true)
              }}
              onError={setError}
            />
          </>
        ) : (
          <>
            {youStill}
            {partnerStill}
          </>
        )}
        {waiterTile}
      </div>

      {state && (
        <div className="card p-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs tracking-[2px] text-[#C9A962]">YOUTUBE WATCH TOGETHER</div>
              <div className="text-[#F8F4ED]">{state.title}</div>
              <div className="text-xs text-[#A8988A] mt-1">
                Official youtube.com/iframe_api player.
                {isFollower
                  ? ' This tab follows the host. Room ' + roomId + '.'
                  : ' Partner tile is muted here so you hear one soundtrack. Room ' + roomId + '.'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isFollower && (
                <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={copyRoomLink}>
                  <LinkIcon className="w-3.5 h-3.5" /> Copy follower link
                </button>
              )}
              {!isFollower && (
                <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={() => onPickerOpenChange(true)}>
                  Change video
                </button>
              )}
              <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={stopWatching}>
                End watch
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-[#E8A0B8] mb-3">{error}</p>}
          {isFollower ? (
            <p className="text-sm text-[#A8988A]">Play, pause, seek, and mute are on the host tab. This screen stays in sync.</p>
          ) : (
          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-gold px-4 py-2" onClick={togglePlay}>
              {state.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {state.playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn btn-ghost px-3 py-2" onClick={toggleMute} aria-label={state.muted ? 'Unmute' : 'Mute'}>
              {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.25}
              value={Math.min(displayTime, duration || displayTime)}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 accent-[#C9A962]"
            />
            <span className="text-xs font-mono text-[#A8988A] w-24 text-right">
              {fmt(displayTime)} / {fmt(duration)}
            </span>
          </div>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-6" onClick={() => onPickerOpenChange(false)}>
          <div className="modal w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="card p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-[#C9A962] text-xs tracking-[3px]">WATCH TOGETHER</div>
                  <h3 className="text-[#F8F4ED] text-3xl mt-1">YouTube in this date room</h3>
                  <p className="text-[#A8988A] text-sm mt-2 max-w-xl">
                    Only YouTube, through Google’s official IFrame Player. Netflix, Hulu, Disney+, and Prime cannot be played inside this website — use “Watch on your own apps.”
                  </p>
                </div>
                <button type="button" onClick={() => onPickerOpenChange(false)} aria-label="Close">
                  <X />
                </button>
              </div>
              <label className="text-sm text-[#A8988A] mb-2 tracking-widest block">PASTE ANY YOUTUBE LINK</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && link.trim()) startVideo(link)
                  }}
                  placeholder="https://youtu.be/… or youtube.com/watch?v=…"
                  className="input flex-1"
                />
                <button type="button" className="btn btn-gold px-8" disabled={!link.trim()} onClick={() => startVideo(link)}>
                  Watch together
                </button>
              </div>
              {error && <p className="text-sm text-[#E8A0B8] mt-3">{error}</p>}
              <div className="mt-6 text-xs text-[#7A6B5F] tracking-widest">ROMANTIC TRAILERS</div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROMANTIC_TRAILERS.map((trailer) => (
                  <button
                    key={trailer.id}
                    type="button"
                    onClick={() => startVideo(trailer.id, trailer.label)}
                    className="movie-card card p-4 text-left border border-[#3A2F36] hover:border-[#E8A0B8]"
                  >
                    <div className="text-[#F8F4ED]">{trailer.label}</div>
                    <div className="text-[#A8988A] text-sm mt-1">{trailer.mood}</div>
                    <div className="text-[#C9A962] text-xs mt-3">PLAY TRAILER →</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function WatchSeat({
  heading,
  label,
  videoId,
  role,
  muted,
  onReady,
  onHostState,
  onError,
}: {
  heading: string
  label: string
  videoId: string
  role: 'host' | 'follower'
  muted: boolean
  onReady: (player: YTPlayerHandle) => void
  onHostState?: (playing: boolean, time: number) => void
  onError: (message: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-[#C9A962] text-xs tracking-[2.5px]">{heading}</div>
      </div>
      <div className="video-frame video-frame-watch">
        <YoutubeEmbed videoId={videoId} role={role} muted={muted} onReady={onReady} onHostState={onHostState} onError={onError} />
        <div className="video-label pointer-events-none">
          <div className="live-dot" /> {label}
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20 pointer-events-none">
          {role === 'host' ? 'HOST' : 'FOLLOW'}
        </div>
      </div>
    </div>
  )
}

function applyToPlayer(player: YTPlayerHandle | null, state: WatchState, forceMute: boolean) {
  if (!player) return
  try {
    const target = expectedTime(state)
    const current = player.getCurrentTime()
    if (Number.isFinite(current) && Math.abs(current - target) > 0.6) {
      player.seekTo(target, true)
    }
    const ps = player.getPlayerState()
    if (state.playing && ps !== 1 && ps !== 3) player.playVideo()
    if (!state.playing && ps === 1) player.pauseVideo()
    if (forceMute || state.muted) player.mute()
  } catch {
    /* not ready */
  }
}

function fmt(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
