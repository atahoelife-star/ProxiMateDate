import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, Link as LinkIcon, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { YoutubeEmbed } from './YoutubeEmbed'
import { OwnAppsCountdown } from './CompanionMode'
import { WatchChatOverlay, type RoomChatMsg } from './WatchChatOverlay'
import {
  bootWatchState,
  emptyWatchState,
  expectedTime,
  subscribeWatchState,
  writeWatchState,
  type WatchState,
} from '../../lib/watchSync'
import { parseYouTubeId, ROMANTIC_TRAILERS, youtubeWatchUrl, type YTPlayerHandle } from '../../lib/youtube'
import { FloatingDateChat } from '../../lib/floatingChat'
import type { ChatMoment } from '../../data/suggestedLines'
import type { RemoteWatch } from '../../lib/liveRoom'

type WatchStageProps = {
  roomId: string
  partnerName: string
  initialVideoId: string | null
  isFollower: boolean
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
  onRoomMessage: (text: string) => void
  chat: {
    messages: RoomChatMsg[]
    input: string
    onInputChange: (value: string) => void
    onSend: () => void
  }
  chatMoment: ChatMoment
  onWatchingChange?: (watching: boolean) => void
  remoteWatch?: RemoteWatch
  onShareWatch?: (videoId: string, title: string) => void
  onShareWatchEnd?: () => void
}

export function WatchStage({
  roomId,
  partnerName,
  initialVideoId,
  isFollower,
  pickerOpen,
  onPickerOpenChange,
  onRoomMessage,
  chat,
  chatMoment,
  onWatchingChange,
  remoteWatch,
  onShareWatch,
  onShareWatchEnd,
}: WatchStageProps) {
  const [link, setLink] = useState('')
  const [parseError, setParseError] = useState('')
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const [together, setTogether] = useState<'youtube' | 'own-apps'>('youtube')
  const [state, setState] = useState<WatchState | null>(() => bootWatchState(roomId, initialVideoId, isFollower))
  const [duration, setDuration] = useState(0)
  const [displayTime, setDisplayTime] = useState(0)
  const [partnerTapNeeded, setPartnerTapNeeded] = useState(false)
  const awaitingRemoteOpen = useRef(false)
  const remoteWatchingRef = useRef(false)

  const hostRef = useRef<YTPlayerHandle | null>(null)
  const applying = useRef(false)
  const stateRef = useRef(state)
  const onRoomMessageRef = useRef(onRoomMessage)
  const floaterRef = useRef(new FloatingDateChat())
  const chatRef = useRef(chat)

  useEffect(() => {
    chatRef.current = chat
  })

  useEffect(() => {
    onRoomMessageRef.current = onRoomMessage
  }, [onRoomMessage])

  useEffect(() => {
    const floater = floaterRef.current
    if (!floater.isOpen()) return
    const c = chatRef.current
    floater.render({
      messages: c.messages,
      input: c.input,
      onInputChange: c.onInputChange,
      onSend: c.onSend,
      partnerName,
      moment: chatMoment,
    })
  }, [chat.messages, chat.input, partnerName, chat.onInputChange, chat.onSend, chatMoment])

  useEffect(() => {
    const floater = floaterRef.current
    return () => floater.close()
  }, [])

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

  useEffect(() => {
    onWatchingChange?.(Boolean(state))
  }, [state, onWatchingChange])

  useEffect(() => {
    if (!remoteWatch) return
    if (!remoteWatch.watching) {
      if (remoteWatchingRef.current && stateRef.current) stopWatching({ remote: true })
      remoteWatchingRef.current = false
      return
    }
    remoteWatchingRef.current = true
    if (stateRef.current?.videoId === remoteWatch.videoId) {
      setLink(youtubeWatchUrl(remoteWatch.videoId))
      return
    }
    applyVideo(remoteWatch.videoId, remoteWatch.title)
    const opened = openOfficialYoutube(remoteWatch.videoId)
    awaitingRemoteOpen.current = !opened
    if (!opened) {
      /* Embed carries them. If embed is blocked, the large tap is shown. */
    }
    // applyVideo / stopWatching are click-path helpers; remote id is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteWatch?.watching, remoteWatch?.videoId, remoteWatch?.title])

  const paintFloater = () => {
    const c = chatRef.current
    floaterRef.current.render({
      messages: c.messages,
      input: c.input,
      onInputChange: c.onInputChange,
      onSend: c.onSend,
      partnerName,
      moment: chatMoment,
    })
  }

  const openFloater = () => {
    if (floaterRef.current.open()) paintFloater()
  }

  /** One window.open per click. A second open is blocked, or it replaces the chat popup with YouTube. */
  const openOfficialYoutube = (videoId: string) => {
    const watch = window.open(youtubeWatchUrl(videoId), 'pd-youtube-watch')
    if (!watch || watch.closed) return false
    try {
      watch.opener = null
    } catch {
      /* ignore */
    }
    return true
  }

  const applyVideo = (raw: string, title?: string) => {
    const id = parseYouTubeId(raw)
    if (!id) {
      setParseError('Paste a youtube.com or youtu.be link, then press Play.')
      return ''
    }
    setParseError('')
    setEmbedBlocked(false)
    setPartnerTapNeeded(false)
    hostRef.current = null
    setLink(youtubeWatchUrl(id))
    publish(emptyWatchState(id, title || 'YouTube'))
    onPickerOpenChange(false)
    return id
  }

  const beginWatch = (raw: string, title?: string) => {
    const id = applyVideo(raw, title)
    if (!id) return
    awaitingRemoteOpen.current = false
    onRoomMessageRef.current(`Watch together: ${title || id}.`)
    onShareWatch?.(id, title || 'YouTube')
    openOfficialYoutube(id)
  }

  const stopWatching = (opts?: { remote?: boolean }) => {
    floaterRef.current.close()
    hostRef.current = null
    awaitingRemoteOpen.current = false
    setPartnerTapNeeded(false)
    setState(null)
    setEmbedBlocked(false)
    setParseError('')
    onPickerOpenChange(false)
    const next = new URL(window.location.href)
    next.searchParams.delete('watch')
    window.history.replaceState({}, '', `${next.pathname}${next.search}`)
    if (!opts?.remote) onShareWatchEnd?.()
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

  const pastedId = parseYouTubeId(link)
  const watchingThisPaste = Boolean(state && pastedId && pastedId === state.videoId)
  const openOnYouTube = Boolean(state && embedBlocked && (!pastedId || watchingThisPaste))

  const onPlayClick = () => {
    if (openOnYouTube && state) {
      onShareWatch?.(state.videoId, state.title)
      openOfficialYoutube(state.videoId)
      setPartnerTapNeeded(false)
      return
    }
    if (pastedId && (!state || pastedId !== state.videoId)) {
      beginWatch(link)
      return
    }
    if (!state) {
      setParseError('Paste a youtube.com or youtu.be link, then press Play.')
      return
    }
    if (isFollower) return
    if (!state.playing) openFloater()
    togglePlay()
  }

  const onSeek = (seconds: number) => {
    const current = stateRef.current
    if (!current) return
    applying.current = true
    hostRef.current?.seekTo(seconds, true)
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
    publish({ ...current, muted })
  }

  const copyRoomLink = () => {
    const url = new URL(`${window.location.origin}${window.location.pathname}`)
    url.searchParams.set('room', roomId)
    url.searchParams.set('follow', '1')
    if (state?.videoId) url.searchParams.set('watch', state.videoId)
    navigator.clipboard.writeText(url.toString())
    toast.success('Follower room link copied', {
      description: 'Open it on their phone or a second browser. The YouTube link is shared in this room.',
    })
  }

  const playLabel = openOnYouTube ? 'Watch on YouTube' : state?.playing && !embedBlocked ? 'Pause' : 'Play'
  const watchHref = state ? youtubeWatchUrl(state.videoId) : pastedId ? youtubeWatchUrl(pastedId) : null

  return (
    <>
      <div className="card p-4 h-full flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs tracking-[2px] text-[#C9A962]">WATCH TOGETHER</div>
            <div className="text-[#F8F4ED]">
              {together === 'own-apps'
                ? 'Sync start on your own apps'
                : state?.title ?? 'Paste a YouTube link to watch together'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn text-xs px-3 py-2 ${together === 'youtube' ? 'btn-gold' : 'btn-ghost border border-white/15'}`}
              onClick={() => setTogether('youtube')}
            >
              YouTube
            </button>
            <button
              type="button"
              className={`btn text-xs px-3 py-2 ${together === 'own-apps' ? 'btn-gold' : 'btn-ghost border border-white/15'}`}
              onClick={() => setTogether('own-apps')}
            >
              Your own apps
            </button>
          </div>
        </div>

        {together === 'own-apps' ? (
          <OwnAppsCountdown partnerName={partnerName} onRoomMessage={onRoomMessage} />
        ) : (
          <>
            {state && (
              <div className="flex flex-wrap gap-2 mb-3">
                {!isFollower && (
                  <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={copyRoomLink}>
                    <LinkIcon className="w-3.5 h-3.5" /> Copy follower link
                  </button>
                )}
                {!isFollower && (
                  <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={() => onPickerOpenChange(true)}>
                    Trailers
                  </button>
                )}
                <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={() => stopWatching()}>
                  End watch
                </button>
              </div>
            )}

            <label className="text-sm text-[#A8988A] mb-2 tracking-widest block">PASTE A YOUTUBE LINK</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value)
                  setParseError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onPlayClick()
                }}
                placeholder="https://youtu.be/… or youtube.com/watch?v=…"
                className="input flex-1"
                aria-label="YouTube link"
              />
              <button type="button" className="btn btn-gold px-6 py-2 shrink-0" onClick={onPlayClick}>
                {openOnYouTube ? <ExternalLink className="w-4 h-4" /> : playLabel === 'Pause' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {playLabel}
              </button>
            </div>
            {parseError && <p className="text-sm text-[#E8A0B8] mt-2">{parseError}</p>}

            {embedBlocked && state && watchHref ? (
              <div className="video-frame video-frame-watch mt-4 flex-1 min-h-[220px]">
                <button
                  type="button"
                  onClick={onPlayClick}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F0A0D] text-[#C9A962] underline px-4 text-center text-sm"
                >
                  Watch on YouTube
                </button>
              </div>
            ) : state ? (
              <div className="video-frame video-frame-watch mt-4 flex-1 min-h-[220px]">
                <YoutubeEmbed
                  videoId={state.videoId}
                  role={isFollower ? 'follower' : 'host'}
                  muted={state.muted || isFollower}
                  onReady={(player) => {
                    hostRef.current = player
                    if (state.muted || isFollower) player.mute()
                    if (isFollower) applyToPlayer(player, state, true)
                  }}
                  onHostState={isFollower ? undefined : onHostState}
                  onError={() => {
                    setEmbedBlocked(true)
                    if (awaitingRemoteOpen.current) setPartnerTapNeeded(true)
                  }}
                />
                <div className="video-label pointer-events-none">
                  <div className="live-dot" /> {isFollower ? 'FOLLOW' : 'WATCH'}
                </div>
              </div>
            ) : null}

            {state && !embedBlocked && !isFollower && (
              <div className="flex items-center gap-3 mt-4">
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
            {state && isFollower && !embedBlocked && (
              <p className="text-sm text-[#A8988A] mt-3">Play, pause, seek, and mute are on the host tab. This screen stays in sync.</p>
            )}
          </>
        )}
      </div>

      {partnerTapNeeded && state && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0F0A0D]/95 px-6 py-10">
          <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">THEY&apos;RE WATCHING</div>
          <h2 className="text-[#F8F4ED] text-3xl md:text-4xl text-center max-w-lg mb-8">
            They&apos;re watching — tap to open YouTube
          </h2>
          <button
            type="button"
            className="btn btn-gold text-xl px-10 py-5 w-full max-w-lg"
            onClick={() => {
              openOfficialYoutube(state.videoId)
              setPartnerTapNeeded(false)
              awaitingRemoteOpen.current = false
            }}
          >
            Open YouTube
          </button>
          <div className="mt-8 w-full max-w-sm h-[min(420px,50vh)]">
            <WatchChatOverlay
              variant="panel"
              caption="Same thread as the date room."
              messages={chat.messages}
              input={chat.input}
              onInputChange={chat.onInputChange}
              onSend={chat.onSend}
              partnerName={partnerName}
              moment={chatMoment}
            />
          </div>
        </div>
      )}

      {state && (
        <div className="fixed bottom-4 right-4 z-[80] w-[360px] max-w-[calc(100vw-2rem)] h-[min(520px,70vh)] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
          <WatchChatOverlay
            variant="panel"
            caption="Same thread as the date room."
            messages={chat.messages}
            input={chat.input}
            onInputChange={chat.onInputChange}
            onSend={chat.onSend}
            partnerName={partnerName}
            moment={chatMoment}
          />
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-6" onClick={() => onPickerOpenChange(false)}>
          <div className="modal w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="card p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-[#C9A962] text-xs tracking-[3px]">WATCH TOGETHER</div>
                  <h3 className="text-[#F8F4ED] text-3xl mt-1">YouTube for movie night</h3>
                  <p className="text-[#A8988A] text-sm mt-2 max-w-xl">
                    Paste a link, then press Play. Netflix, Hulu, Disney+, and Prime stay on your own apps — use Your own apps for a shared countdown.
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
                    if (e.key === 'Enter' && link.trim()) beginWatch(link)
                  }}
                  placeholder="https://youtu.be/… or youtube.com/watch?v=…"
                  className="input flex-1"
                />
                <button type="button" className="btn btn-gold px-8" disabled={!link.trim()} onClick={() => beginWatch(link)}>
                  Play
                </button>
              </div>
              <div className="mt-6 text-xs text-[#7A6B5F] tracking-widest">ROMANTIC TRAILERS</div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROMANTIC_TRAILERS.map((trailer) => (
                  <button
                    key={trailer.id}
                    type="button"
                    onClick={() => beginWatch(trailer.id, trailer.label)}
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
