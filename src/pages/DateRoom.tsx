import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import YouTube from 'react-youtube'
import { toast } from 'sonner'
import {
  Clock,
  Heart,
  Link as LinkIcon,
  Mail,
  Pause,
  Play,
  Send,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import { DinnerMenus } from '../components/dateroom/DinnerMenus'
import { WaiterVideoTile } from '../components/dateroom/WaiterVideoTile'
import {
  formatPrice,
  getRestaurant,
  orderTotal,
  type OrderLine,
  type RestaurantId,
} from '../data/menus'
import { clipForMenuCourse, type WaiterClip } from '../data/waiterClips'
import { createWatchSync, newRoomId, type WatchEvent } from '../lib/watchSync'

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getPlayerState: () => number
}

type ChatMsg = { id: number; sender: 'me' | 'partner' | 'system'; text: string }

const partnerReplies = [
  'I feel the same way… I keep reaching for your hand even though you’re not here.',
  'You always know exactly what to say to make my heart flutter.',
  'This is my favorite part of the week now. Just you and me in our little world.',
  'I wish I could kiss you through the screen right now.',
  'Tell me more… I love listening to your voice like this.',
  'Being here with you like this makes the distance feel smaller.',
]

const personalities = {
  poet: {
    name: 'The Poet',
    emoji: '✍️',
    description: 'Speaks in beautiful metaphors and deep questions',
    responses: [
      'Your words fall like rose petals on still water… tell me more about that feeling.',
      'In this moment, across the distance, our hearts write the same poem.',
      'What part of your soul is longing to be held tonight?',
      'Even the stars seem closer when we speak like this.',
    ],
  },
  flirt: {
    name: 'The Flirt',
    emoji: '😉',
    description: 'Playful, teasing, and a little cheeky',
    responses: [
      'Oh? Keep talking like that and I might have to come steal you away.',
      'You’re making me blush over here… and you know exactly what you’re doing.',
      'If I were there right now, that smile would be in so much trouble.',
      'Careful… you’re dangerously good at making me want you more.',
    ],
  },
  dreamer: {
    name: 'The Dreamer',
    emoji: '🌙',
    description: 'Imaginative and future-oriented',
    responses: [
      'Close your eyes for a second. Imagine we’re walking through Paris at night… what do you see?',
      'One day we’ll have a little place with a balcony and we’ll do this every evening.',
      'I can already picture our next real date. It’s going to be perfect.',
      'What’s one adventure you want us to have together someday?',
    ],
  },
  listener: {
    name: 'The Listener',
    emoji: '🫶',
    description: 'Calm, warm, and deeply present',
    responses: [
      'I’m right here with you. Take all the time you need.',
      'That sounds really important to you. Thank you for sharing it with me.',
      'You don’t have to be strong tonight. I’ve got you.',
      'I’m holding space for whatever you’re feeling right now.',
    ],
  },
}

const movies = [
  { id: 1, title: 'Before Sunrise', year: '1995', mood: 'Deep & Romantic', duration: '101 min' },
  { id: 2, title: 'La La Land', year: '2016', mood: 'Dreamy & Musical', duration: '128 min' },
  { id: 3, title: 'Pride & Prejudice', year: '2005', mood: 'Tender & Elegant', duration: '129 min' },
  { id: 4, title: 'The Notebook', year: '2004', mood: 'Passionate & Emotional', duration: '123 min' },
]

function movieFromWindow() {
  if (typeof window === 'undefined') return null
  const watch = new URLSearchParams(window.location.search).get('watch')
  if (watch && watch !== 'open' && /^[a-zA-Z0-9_-]{11}$/.test(watch)) {
    return {
      id: 'youtube-' + watch,
      title: 'Watch together',
      isYoutube: true,
      youtubeId: watch,
    }
  }
  return null
}

function roomFromWindow() {
  if (typeof window === 'undefined') return newRoomId()
  return new URLSearchParams(window.location.search).get('room') || newRoomId()
}

export function DateRoomPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMovie = movieFromWindow()
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 1, sender: 'partner', text: 'I miss your face so much tonight... this feels really nice already ❤️' },
    { id: 2, sender: 'me', text: 'You look beautiful. I can’t stop smiling.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [partnerName, setPartnerName] = useState('Emma')
  const [roomTime, setRoomTime] = useState('00:00')
  const [aiCompanionOpen, setAiCompanionOpen] = useState(false)
  const [activePersonality, setActivePersonality] = useState<keyof typeof personalities | null>(null)
  const [aiMessages, setAiMessages] = useState<{ id: number; sender: string; text: string }[]>([])
  const [aiInput, setAiInput] = useState('')
  const [showWaiterMenu, setShowWaiterMenu] = useState(false)
  const [showMoviePicker, setShowMoviePicker] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('watch') === 'open',
  )
  const [currentMovie, setCurrentMovie] = useState<{
    id: string | number
    title: string
    isYoutube?: boolean
    youtubeId?: string
    year?: string
    duration?: string
    mood?: string
  } | null>(initialMovie)
  const [isMoviePlaying, setIsMoviePlaying] = useState(() => initialMovie !== null)
  const [movieProgress, setMovieProgress] = useState(0)
  const [youtubeInput, setYoutubeInput] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [netflixOpen, setNetflixOpen] = useState(false)
  const [netflixPlaying, setNetflixPlaying] = useState(false)

  const [youRestaurant, setYouRestaurant] = useState<RestaurantId>('verdant-ember')
  const [partnerRestaurant, setPartnerRestaurant] = useState<RestaurantId>('silver-sage')
  const [youOrder, setYouOrder] = useState<OrderLine[]>([])
  const [partnerOrder, setPartnerOrder] = useState<OrderLine[]>([])
  const [tableOrder, setTableOrder] = useState<OrderLine[]>([])
  const [waiterClip, setWaiterClip] = useState<WaiterClip>('idle')
  const [waiterNote, setWaiterNote] = useState('Ready when you are')
  const [watchStatus, setWatchStatus] = useState('Share the watch link so play/pause stays together')

  const roomIdRef = useRef(roomFromWindow())
  const playerRef = useRef<YTPlayer | null>(null)
  const applyingRemote = useRef(false)
  const syncRef = useRef<ReturnType<typeof createWatchSync> | null>(null)
  const movieRef = useRef(currentMovie)

  useEffect(() => {
    movieRef.current = currentMovie
  }, [currentMovie])

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setRoomTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const applyRemote = (event: WatchEvent) => {
      if (event.type === 'hello') setWatchStatus('Partner is in this watch room')
      if (event.type === 'request-state') {
        const movie = movieRef.current
        const player = playerRef.current
        if (movie?.youtubeId) {
          syncRef.current?.send({ type: 'video', videoId: movie.youtubeId, title: movie.title })
        }
        if (player) {
          const playing = player.getPlayerState() === 1
          const time = player.getCurrentTime()
          syncRef.current?.send(
            playing ? { type: 'play', time, at: Date.now() } : { type: 'pause', time },
          )
        }
        return
      }
      if (event.type === 'video' && event.videoId) {
        setCurrentMovie({
          id: 'youtube-' + event.videoId,
          title: event.title || 'Watch together',
          isYoutube: true,
          youtubeId: event.videoId,
        })
        setIsMoviePlaying(true)
        setShowMoviePicker(false)
        return
      }
      const player = playerRef.current
      if (!player) return
      applyingRemote.current = true
      if (event.type === 'play') {
        const target = (event.time ?? 0) + (Date.now() - (event.at ?? Date.now())) / 1000
        if (Math.abs(player.getCurrentTime() - target) > 1.75) player.seekTo(target, true)
        player.playVideo()
      }
      if (event.type === 'pause') {
        player.seekTo(event.time ?? 0, true)
        player.pauseVideo()
      }
      if (event.type === 'seek') {
        player.seekTo(event.time, true)
        if (event.playing) player.playVideo()
        else player.pauseVideo()
      }
      window.setTimeout(() => {
        applyingRemote.current = false
      }, 500)
    }

    const sync = createWatchSync(roomIdRef.current, applyRemote)
    syncRef.current = sync
    return () => {
      sync.destroy()
      syncRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const player = playerRef.current
      if (!player || applyingRemote.current || player.getPlayerState() !== 1) return
      syncRef.current?.send({ type: 'play', time: player.getCurrentTime(), at: Date.now() })
    }, 2500)
    return () => window.clearInterval(id)
  }, [])

  const watchTogetherUrl = () => {
    const url = new URL(window.location.origin + '/date-room')
    url.searchParams.set('room', roomIdRef.current)
    const id = movieRef.current?.youtubeId
    if (id) url.searchParams.set('watch', id)
    return url.toString()
  }

  const copyWatchLink = () => {
    navigator.clipboard.writeText(watchTogetherUrl())
    toast.success('Watch-together link copied', {
      description: 'Open it on the other phone or laptop. Play/pause/seek sync over this room.',
    })
  }

  const emitLocalWatch = (event: WatchEvent) => {
    if (applyingRemote.current) return
    syncRef.current?.send(event)
  }

  const roomMessage = (text: string) => {
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: 'system', text }])
  }

  const playWaiter = (clip: WaiterClip, note: string, chat?: string) => {
    setWaiterClip(clip)
    setWaiterNote(note)
    if (chat) roomMessage(chat)
  }

  const addOrderLine = (line: Omit<OrderLine, 'lineId'>) => {
    const full: OrderLine = { ...line, lineId: `${line.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
    if (full.seat === 'you') setYouOrder((prev) => [...prev, full])
    else if (full.seat === 'partner') setPartnerOrder((prev) => [...prev, full])
    else setTableOrder((prev) => [...prev, full])

    const clip = clipForMenuCourse(full.course)
    const who = full.seat === 'table' ? 'the table' : full.seat === 'you' ? 'you' : partnerName
    playWaiter(
      clip,
      clip === 'dessert' ? 'Serving dessert' : 'Setting a plate',
      `The waiter brings ${full.name} for ${who} (${full.restaurantName})${full.side ? ` with ${full.side}` : ''}. Demo only — nothing is cooked or charged.`,
    )
  }

  const removeOrderLine = (lineId: string) => {
    setYouOrder((prev) => prev.filter((l) => l.lineId !== lineId))
    setPartnerOrder((prev) => prev.filter((l) => l.lineId !== lineId))
    setTableOrder((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const newMsg: ChatMsg = { id: Date.now(), sender: 'me', text: chatInput.trim() }
    setChatMessages((prev) => [...prev, newMsg])
    setChatInput('')
    setTimeout(() => {
      const reply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)]
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'partner', text: reply }])
    }, 1100 + Math.random() * 700)
  }

  const sendAiMessage = () => {
    if (!aiInput.trim() || !activePersonality) return
    const personality = personalities[activePersonality]
    const userMsg = { id: Date.now(), sender: 'me', text: aiInput.trim() }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput('')
    setTimeout(() => {
      const responses = personality.responses
      const aiReplyText = responses[Math.floor(Math.random() * responses.length)]
      setAiMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReplyText }])
    }, 850)
  }

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null
    const trimmed = url.trim()
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (shortMatch) return shortMatch[1]
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch) return watchMatch[1]
    const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
    return null
  }

  const startYoutubeFromLink = (url: string, customTitle?: string) => {
    const videoId = getYoutubeVideoId(url)
    if (!videoId) {
      toast.error('Invalid YouTube link', {
        description: 'Paste a YouTube URL (youtu.be/... or youtube.com/watch?v=...)',
      })
      return
    }
    setCurrentMovie({
      id: 'youtube-' + videoId,
      title: customTitle || 'YouTube Video',
      isYoutube: true,
      youtubeId: videoId,
      mood: 'Custom pick',
    })
    setShowMoviePicker(false)
    setIsMoviePlaying(true)
    setMovieProgress(0)
    const next = new URLSearchParams(searchParams)
    next.set('room', roomIdRef.current)
    next.set('watch', videoId)
    setSearchParams(next, { replace: true })
    emitLocalWatch({ type: 'video', videoId, title: customTitle || 'YouTube Video' })
    roomMessage('YouTube watch-together started. Copy the room link so both browsers stay in sync.')
  }

  const startMovie = (movie: (typeof movies)[number]) => {
    setCurrentMovie(movie)
    setShowMoviePicker(false)
    setIsMoviePlaying(true)
    setMovieProgress(0)
    roomMessage(`Preview: you started watching "${movie.title}" together. Full films are not licensed here.`)
  }

  const sendTableToWaiter = () => {
    const all = [...youOrder, ...partnerOrder, ...tableOrder]
    if (all.length === 0) {
      toast.message('Nothing to serve yet', { description: 'Add dishes from either menu first.' })
      return
    }
    const dessertOnly = all.every((l) => l.course === 'dessert')
    const clip: WaiterClip = dessertOnly ? 'dessert' : 'plate'
    const summary = all
      .map((l) => `${l.name} (${l.restaurantName})`)
      .join('; ')
    playWaiter(
      clip,
      'Serving this table',
      `The waiter takes the mixed table: ${summary}. Total ${formatPrice(orderTotal(all))} — demo only, no kitchen, no card.`,
    )
    setShowWaiterMenu(false)
  }

  const waiterActions: { title: string; message: string; clip: WaiterClip }[] = [
    {
      title: 'Greet us at the table',
      message: 'The waiter arrives, nods to both of you, and waits for the mixed order.',
      clip: 'greet',
    },
    {
      title: 'Pour two glasses of our favorite rosé',
      message: 'Wine is poured for the table. The waiter video plays beside you — not a CSS bottle.',
      clip: 'wine',
    },
    {
      title: 'Pop a bottle of champagne for us',
      message: 'Champagne is poured. Watch the waiter tile, same chrome as YOU and your date.',
      clip: 'champagne',
    },
    {
      title: 'Set the plates from both kitchens',
      message: 'Plates from The Verdant Ember and The Silver Sage can land on the same table.',
      clip: 'plate',
    },
    {
      title: 'Bring dessert',
      message: 'Soufflé or crème brûlée — from either menu — is set down for you.',
      clip: 'dessert',
    },
  ]

  return (
    <div
      className="date-room-bg min-h-[calc(100vh-80px)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.65), rgba(15,10,13,0.82)), url('/images/candlelit-table.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 38%',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-[#C9A962] text-[#0F0A0D] text-sm text-center tracking-wide">
        Preview / demo date room — not a live two-person call. Orders stay in this browser. Waiter clips are serving videos, not a webcam.
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-white/10 bg-[#0F0A0D]/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[#C9A962]">
            <Clock className="w-4 h-4" />
            <span className="font-mono tracking-[3px] text-sm">{roomTime}</span>
          </div>
          <div className="text-[#E8A0B8] text-sm">•</div>
          <div>
            <span className="text-[#F8F4ED] font-medium text-lg">Candlelit Table</span>
            <span className="text-[#A8988A] text-sm ml-2">— Preview for two kitchens</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setInviteStep('options')
              setShowInviteModal(true)
            }}
            className="btn btn-outline px-5 py-2 text-sm flex items-center gap-2 border-[#E8A0B8] hover:bg-[#E8A0B8] hover:text-[#0F0A0D]"
          >
            <UserPlus className="w-4 h-4" /> Invite Your Date
          </button>
          <Link to="/" className="btn btn-ghost px-6 py-2 text-sm border border-[#E8A0B8]/40">
            End Date
          </Link>
          <div className="px-4 py-1.5 text-xs rounded-full bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30 tracking-widest">
            DEMO • PREVIEW
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="text-[#C9A962] text-xs tracking-[2.5px]">ME</div>
                  <div className="flex-1 h-px bg-[#3A2F36]" />
                </div>
                <div className="video-frame">
                  <img src="/images/man-avatar.jpg" alt="You (preview still)" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="overlay" />
                  <div className="video-label">
                    <div className="live-dot" /> YOU
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">
                    LIVE
                  </div>
                </div>
                <p className="text-[11px] text-[#7A6B5F] mt-2">Stock still — not your webcam.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="text-[#E8A0B8] text-xs tracking-[2.5px]">MY DATE</div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = window.prompt("What is your date's name tonight?", partnerName)
                      if (next) setPartnerName(next)
                    }}
                    className="text-[#C9A962] text-xs underline hover:text-[#E8A0B8]"
                  >
                    edit name
                  </button>
                </div>
                <div className="video-frame">
                  <img src="/images/woman-avatar.jpg" alt={`${partnerName} (preview still)`} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="overlay" />
                  <div className="video-label">
                    <div className="live-dot" /> {partnerName.toUpperCase()}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">
                    LIVE
                  </div>
                </div>
                <p className="text-[11px] text-[#7A6B5F] mt-2">Stock still — not a live partner feed.</p>
              </div>

              <WaiterVideoTile clip={waiterClip} onServiceEnded={() => setWaiterClip('idle')} />
            </div>
            <p className="text-center text-xs text-[#A8988A] mt-3">{waiterNote}</p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowWaiterMenu(true)
                  playWaiter('greet', 'Waiter at the table', 'The waiter steps into frame.')
                }}
                className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D]"
              >
                <Sparkles className="w-5 h-5" /> Call Waiter
              </button>
              <button
                type="button"
                onClick={() => setAiCompanionOpen(true)}
                className="btn btn-gold py-[19px] text-[15px] flex items-center justify-center gap-3"
              >
                <Heart className="w-5 h-5" /> AI Companion
              </button>
              <button
                type="button"
                onClick={() => setShowMoviePicker(true)}
                className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D]"
              >
                <Play className="w-5 h-5" /> YouTube together
              </button>
              <button
                type="button"
                onClick={() => setNetflixOpen(true)}
                className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#E8A0B8] hover:bg-[#E8A0B8] hover:text-[#0F0A0D]"
              >
                <Play className="w-5 h-5" /> Netflix companion
              </button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="card flex flex-col h-full" style={{ minHeight: '520px' }}>
              <div className="px-6 py-4 border-b border-[#3A2F36] bg-[#1A1418]">
                <div className="text-[#F8F4ED] font-medium">Private Chat</div>
                <div className="text-xs text-[#A8988A]">Demo replies are simulated. Not a live messenger.</div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[15px] bg-[#0F0A0D]/40" style={{ maxHeight: '360px' }}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`chat-bubble ${msg.sender === 'me' ? 'me' : msg.sender === 'partner' ? 'date' : 'system'}`}>
                      {msg.sender === 'system' && <span className="block text-[#C9A962] text-xs mb-1 tracking-wider">THE ROOM</span>}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[#3A2F36] bg-[#1A1418] flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={`Message ${partnerName}...`}
                  className="input flex-1"
                />
                <button type="button" onClick={sendChatMessage} disabled={!chatInput.trim()} className="btn btn-gold px-6">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <DinnerMenus
          partnerName={partnerName}
          youRestaurant={youRestaurant}
          partnerRestaurant={partnerRestaurant}
          onYouRestaurant={setYouRestaurant}
          onPartnerRestaurant={setPartnerRestaurant}
          youOrder={youOrder}
          partnerOrder={partnerOrder}
          tableOrder={tableOrder}
          onAdd={addOrderLine}
          onRemove={removeOrderLine}
        />
      </div>

      <AnimatePresence>
        {showWaiterMenu && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowWaiterMenu(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="modal w-full max-w-xl bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-4">
                  <Sparkles className="text-[#C9A962] w-6 h-6" />
                </div>
                <h3 className="text-[#F8F4ED] text-2xl">Good evening. How may I serve you?</h3>
                <p className="text-[#A8988A] text-sm mt-1">
                  Service plays on the Waiter video tile. I can take The Verdant Ember and The Silver Sage in one visit.
                </p>
              </div>
              <button type="button" className="btn btn-gold w-full mb-4 py-3" onClick={sendTableToWaiter}>
                Serve everything on this table
              </button>
              <div className="grid gap-3">
                {waiterActions.map((action) => (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => {
                      playWaiter(action.clip, action.title, action.message)
                      setShowWaiterMenu(false)
                    }}
                    className="text-left p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] hover:bg-[#221C21] transition"
                  >
                    <div className="text-[#EDE4D9] text-[15px]">{action.title}</div>
                  </button>
                ))}
              </div>
              <WaiterQuickOrder
                youRestaurant={youRestaurant}
                partnerRestaurant={partnerRestaurant}
                partnerName={partnerName}
                onAdd={addOrderLine}
              />
              <div className="text-center mt-8 text-xs text-[#7A6B5F] tracking-widest">Demo service — local state only</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiCompanionOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" onClick={() => setAiCompanionOpen(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="modal w-full max-w-2xl bg-[#1A1418] border border-[#3A2F36] rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-[#3A2F36]">
                <div>
                  <div className="flex items-center gap-3 text-[#F8F4ED] text-2xl">
                    <Heart className="text-[#E8A0B8]" /> AI Companion Mode
                  </div>
                  <p className="text-[#A8988A] text-sm mt-1">Scripted preview personalities. Not a live model billed to you.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiCompanionOpen(false)
                    setActivePersonality(null)
                    setAiMessages([])
                    setAiInput('')
                  }}
                  className="text-[#A8988A] hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {!activePersonality ? (
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(personalities).map(([key, p]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivePersonality(key as keyof typeof personalities)}
                        className="personality-btn text-left p-8 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] flex flex-col bg-[#1A1418]"
                      >
                        <div className="text-4xl mb-4">{p.emoji}</div>
                        <div className="text-[#F8F4ED] text-2xl">{p.name}</div>
                        <div className="text-[#A8988A] mt-3 text-sm">{p.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[420px]">
                  <div className="px-8 py-4 bg-[#0F0A0D] flex items-center gap-3 border-b border-[#3A2F36]">
                    <div className="text-2xl">{personalities[activePersonality].emoji}</div>
                    <div>
                      <div className="text-[#F8F4ED] font-medium">{personalities[activePersonality].name}</div>
                      <div className="text-xs text-[#C9A962]">Listening…</div>
                    </div>
                    <button type="button" onClick={() => { setActivePersonality(null); setAiMessages([]) }} className="ml-auto text-xs text-[#A8988A] underline">
                      Change personality
                    </button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto space-y-5 text-sm">
                    {aiMessages.length === 0 && <div className="text-center text-[#A8988A] pt-8 italic">Hello… what’s on your heart tonight?</div>}
                    {aiMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                        <div className={`chat-bubble ${msg.sender === 'me' ? 'me' : 'date'}`}>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 border-t border-[#3A2F36] bg-[#1A1418] flex gap-3">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                      placeholder={`Talk to ${personalities[activePersonality].name}...`}
                      className="input flex-1"
                    />
                    <button type="button" onClick={sendAiMessage} disabled={!aiInput.trim()} className="btn btn-gold px-7">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentMovie && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 p-4"
            onClick={() => {
              setCurrentMovie(null)
              setIsMoviePlaying(false)
            }}
          >
            <motion.div
              className={`modal w-full bg-[#0F0A0D] border border-[#3A2F36] rounded-3xl overflow-hidden ${currentMovie.isYoutube ? 'max-w-6xl' : 'max-w-5xl'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1A1418] px-6 py-4 flex items-center justify-between gap-3 border-b border-[#3A2F36]">
                <div>
                  <div className="text-[#C9A962] font-medium tracking-widest text-sm">
                    {currentMovie.isYoutube ? 'YOUTUBE WATCH-TOGETHER' : 'MOVIE NIGHT PREVIEW'}
                  </div>
                  <div className="text-[#F8F4ED] font-medium">{currentMovie.title}</div>
                  <div className="text-xs text-[#A8988A] mt-1">{watchStatus}</div>
                </div>
                <div className="flex items-center gap-2">
                  {currentMovie.isYoutube && (
                    <button type="button" className="btn btn-ghost text-xs px-3 py-2" onClick={copyWatchLink}>
                      Copy sync link
                    </button>
                  )}
                  <button type="button" onClick={() => { setCurrentMovie(null); setIsMoviePlaying(false); playerRef.current = null }} className="text-[#A8988A] hover:text-white">
                    <X />
                  </button>
                </div>
              </div>
              <div className="relative bg-black">
                {!isMoviePlaying ? (
                  <div className="aspect-video flex flex-col items-center justify-center text-center p-8">
                    <button type="button" onClick={() => setIsMoviePlaying(true)} className="btn btn-gold px-10 py-4 text-lg flex items-center gap-3">
                      <Play className="w-6 h-6" /> Play
                    </button>
                  </div>
                ) : currentMovie.isYoutube && currentMovie.youtubeId ? (
                  <div className="aspect-video bg-black">
                    <YouTube
                      videoId={currentMovie.youtubeId}
                      opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, modestbranding: 1, rel: 0, controls: 1 } }}
                      className="w-full h-full"
                      iframeClassName="w-full h-full"
                      onReady={(event) => {
                        playerRef.current = event.target
                        event.target.playVideo()
                      }}
                      onPlay={() => {
                        const player = playerRef.current
                        emitLocalWatch({ type: 'play', time: player?.getCurrentTime() ?? 0, at: Date.now() })
                      }}
                      onPause={() => {
                        const player = playerRef.current
                        emitLocalWatch({ type: 'pause', time: player?.getCurrentTime() ?? 0 })
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col">
                    <div className="flex-1 flex items-center justify-center text-center px-8">
                      <div>
                        <div className="text-[#F8F4ED] text-4xl">{currentMovie.title}</div>
                        <div className="text-[#A8988A] mt-3">Placeholder mood — we do not stream this film. Use YouTube for a real clip.</div>
                      </div>
                    </div>
                    <div className="bg-[#111] p-4 flex items-center gap-4">
                      <button type="button" onClick={() => setIsMoviePlaying(false)} className="text-[#E8A0B8]">
                        <Pause className="w-6 h-6" />
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={movieProgress}
                        onChange={(e) => setMovieProgress(Number(e.target.value))}
                        className="w-full accent-[#C9A962]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoviePicker && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-6"
            onClick={() => {
              setShowMoviePicker(false)
              setYoutubeInput('')
            }}
          >
            <div className="modal w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="card p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-[#C9A962] text-xs tracking-[3px]">WATCH TOGETHER</div>
                    <h3 className="text-[#F8F4ED] text-3xl mt-1">YouTube in this browser</h3>
                    <p className="text-[#A8988A] text-sm mt-2">Play, pause, and seek sync across both browsers in this room. Netflix is companion-only and is not embedded.</p>
                    <button type="button" className="btn btn-ghost text-xs mt-3 px-3 py-2" onClick={copyWatchLink}>
                      Copy watch-together link
                    </button>
                  </div>
                  <button type="button" onClick={() => { setShowMoviePicker(false); setYoutubeInput('') }}>
                    <X />
                  </button>
                </div>
                <div className="mb-8">
                  <div className="text-sm text-[#A8988A] mb-2 tracking-widest">PASTE ANY YOUTUBE LINK</div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && youtubeInput.trim()) startYoutubeFromLink(youtubeInput)
                      }}
                      placeholder="https://youtu.be/0pdqf4P9MB8"
                      className="input flex-1"
                    />
                    <button type="button" onClick={() => youtubeInput.trim() && startYoutubeFromLink(youtubeInput)} className="btn btn-gold px-8" disabled={!youtubeInput.trim()}>
                      Watch
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'La La Land', id: '0pdqf4P9MB8' },
                      { label: 'The Notebook', id: 'yDJIcYE32NU' },
                      { label: 'Pride & Prejudice', id: 'Ur_DIHsARJ4' },
                      { label: 'Before Sunrise', id: '9vN6DHB6bJc' },
                    ].map((trailer) => (
                      <button
                        key={trailer.id}
                        type="button"
                        onClick={() => startYoutubeFromLink(`https://www.youtube.com/watch?v=${trailer.id}`, trailer.label)}
                        className="movie-card card p-4 text-left border border-[#3A2F36] hover:border-[#E8A0B8]"
                      >
                        <div className="text-[#F8F4ED]">{trailer.label}</div>
                        <div className="text-[#C9A962] text-xs mt-3">PLAY TRAILER →</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[#3A2F36] pt-6">
                  <div className="text-sm text-[#A8988A] mb-3 tracking-widest">MOOD CARDS (NOT THE FULL FILM)</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {movies.map((movie) => (
                      <button key={movie.id} type="button" onClick={() => startMovie(movie)} className="movie-card card p-6 text-left border border-[#3A2F36] hover:border-[#C9A962]">
                        <div className="text-[#C9A962] text-xs tracking-widest">{movie.year} • {movie.duration}</div>
                        <div className="text-[#F8F4ED] text-2xl mt-2">{movie.title}</div>
                        <div className="text-[#A8988A] mt-1 text-sm">{movie.mood}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {netflixOpen && (
          <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4" onClick={() => setNetflixOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="modal w-full max-w-lg bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[#F8F4ED] text-2xl">Netflix companion mode</h3>
                <button type="button" onClick={() => setNetflixOpen(false)}><X className="text-[#A8988A]" /></button>
              </div>
              <p className="text-[#A8988A] text-sm leading-relaxed mb-4">
                Netflix is not embedded on this website. Each of you opens Netflix on your own account (another tab or the Netflix app). This date room stays open as the companion: chat, both restaurant menus, and the waiter tile remain here.
              </p>
              <p className="text-[#EDE4D9] text-sm mb-6">
                Status: {netflixPlaying ? 'You marked the companion as playing.' : 'Paused / not started.'}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-gold flex-1"
                  onClick={() => {
                    setNetflixPlaying(true)
                    roomMessage(`${partnerName} and you are watching on your own Netflix accounts. This page is the companion — we do not stream Netflix.`)
                  }}
                >
                  We’re watching
                </button>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => {
                    setNetflixPlaying(false)
                    roomMessage('Companion paused. Menus and waiter are still on this table.')
                  }}
                >
                  Pause companion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={() => setShowInviteModal(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="modal w-full max-w-lg bg-[#1A1418] border border-[#3A2F36] rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {inviteStep === 'options' ? (
                <>
                  <div className="px-8 pt-8 pb-6 text-center border-b border-[#3A2F36]">
                    <h3 className="text-[#F8F4ED] text-2xl">Share this preview</h3>
                    <p className="text-[#A8988A] mt-2 text-sm">Invites are not emailed yet. Copy the date-room URL for {partnerName}.</p>
                  </div>
                  <div className="p-8 space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/date-room`
                        navigator.clipboard.writeText(link)
                        toast.success('Preview link copied', { description: 'Live invites are not sending. This opens the demo.' })
                      }}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#C9A962] text-left"
                    >
                      <LinkIcon className="w-5 h-5 text-[#C9A962]" />
                      <div>
                        <div className="text-[#F8F4ED] font-medium">Copy date-room URL</div>
                        <div className="text-[#A8988A] text-sm">Same preview, including both menus</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteStep('success')}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] text-left"
                    >
                      <Mail className="w-5 h-5 text-[#E8A0B8]" />
                      <div>
                        <div className="text-[#F8F4ED] font-medium">Compose a note (demo)</div>
                        <div className="text-[#A8988A] text-sm">Does not send mail</div>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <h3 className="text-[#F8F4ED] text-2xl">Nothing was sent</h3>
                  <p className="text-[#A8988A] mt-3">This preview does not notify {partnerName}. Share the copied URL yourself.</p>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-gold mt-6 w-full py-3">
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WaiterQuickOrder({
  youRestaurant,
  partnerRestaurant,
  partnerName,
  onAdd,
}: {
  youRestaurant: RestaurantId
  partnerRestaurant: RestaurantId
  partnerName: string
  onAdd: (line: Omit<OrderLine, 'lineId'>) => void
}) {
  const yours = getRestaurant(youRestaurant)
  const theirs = getRestaurant(partnerRestaurant)
  return (
    <div className="mt-6 pt-6 border-t border-[#3A2F36]">
      <div className="text-xs tracking-widest text-[#C9A962] mb-3">ORDER FROM EITHER MENU</div>
      {[{ seat: 'you' as const, restaurant: yours, label: 'For you' }, { seat: 'partner' as const, restaurant: theirs, label: `For ${partnerName}` }].map(({ seat, restaurant, label }) => (
        <div key={seat} className="mb-4">
          <div className="text-[#F8F4ED] text-sm mb-2">
            {label} · {restaurant.name}
          </div>
          <div className="flex flex-wrap gap-2">
            {restaurant.items.slice(0, 4).map((item) => (
              <button
                key={`${seat}-${item.id}`}
                type="button"
                className="text-xs px-3 py-2 rounded-full border border-[#3A2F36] hover:border-[#C9A962]"
                onClick={() =>
                  onAdd({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    itemId: item.id,
                    name: item.name,
                    price: item.price,
                    course: item.course,
                    forTwo: item.forTwo,
                    seat: item.forTwo ? 'table' : seat,
                  })
                }
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
