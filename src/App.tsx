import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Video, Star, Calendar, Users, ArrowRight, Play, X, Check, Send, Pause, Clock, Sparkles, Link, Mail, UserPlus } from 'lucide-react'
import YouTube from 'react-youtube'
import { toast } from 'sonner'

// Simple view type for step-by-step building
type View = 'landing' | 'pricing' | 'dateroom'

function App() {
  const [currentView, setCurrentView] = useState<View>('landing')

  // Elegant navigation handler
  const navigate = (view: View) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Pricing page state
  const [selectedPlan, setSelectedPlan] = useState<string | null>('dinner') // Pre-select the most popular
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null)

  // ============================================
  // VIRTUAL DATE ROOM STATE (STEP 3)
  // ============================================
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'partner', text: "I miss your face so much tonight... this feels really nice already ❤️" },
    { id: 2, sender: 'me', text: "You look beautiful. I can’t stop smiling." },
  ])
  const [chatInput, setChatInput] = useState('')
  const [partnerName, setPartnerName] = useState('Emma')
  const [roomTime, setRoomTime] = useState('00:00')
  const [aiCompanionOpen, setAiCompanionOpen] = useState(false)
  const [activePersonality, setActivePersonality] = useState<'poet' | 'flirt' | 'dreamer' | 'listener' | null>(null)
  const [aiMessages, setAiMessages] = useState<any[]>([])
  const [aiInput, setAiInput] = useState('')
  const [showWaiterMenu, setShowWaiterMenu] = useState(false)
  const [activeWaiterService, setActiveWaiterService] = useState<any>(null)
  const [showMoviePicker, setShowMoviePicker] = useState(false)
  const [currentMovie, setCurrentMovie] = useState<any>(null)
  const [isMoviePlaying, setIsMoviePlaying] = useState(false)
  const [movieProgress, setMovieProgress] = useState(0)
  const [youtubeInput, setYoutubeInput] = useState('')

  // Invite Your Date feature
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')

  // Live date timer (starts when entering the room)
  useEffect(() => {
    if (currentView !== 'dateroom') return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setRoomTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [currentView])

  // Romantic partner reply bank (simple but sweet)
  const partnerReplies = [
    "I feel the same way… I keep reaching for your hand even though you’re not here.",
    "You always know exactly what to say to make my heart flutter.",
    "This is my favorite part of the week now. Just you and me in our little world.",
    "I wish I could kiss you through the screen right now.",
    "Tell me more… I love listening to your voice like this.",
    "Being here with you like this makes the distance feel smaller.",
  ]

  // AI Companion personalities with distinct voices
  const personalities = {
    poet: {
      name: "The Poet",
      emoji: "✍️",
      description: "Speaks in beautiful metaphors and deep questions",
      responses: [
        "Your words fall like rose petals on still water… tell me more about that feeling.",
        "In this moment, across the distance, our hearts write the same poem.",
        "What part of your soul is longing to be held tonight?",
        "Even the stars seem closer when we speak like this.",
      ]
    },
    flirt: {
      name: "The Flirt",
      emoji: "😉",
      description: "Playful, teasing, and a little cheeky",
      responses: [
        "Oh? Keep talking like that and I might have to come steal you away.",
        "You’re making me blush over here… and you know exactly what you’re doing.",
        "If I were there right now, that smile would be in so much trouble.",
        "Careful… you’re dangerously good at making me want you more.",
      ]
    },
    dreamer: {
      name: "The Dreamer",
      emoji: "🌙",
      description: "Imaginative and future-oriented",
      responses: [
        "Close your eyes for a second. Imagine we’re walking through Paris at night… what do you see?",
        "One day we’ll have a little place with a balcony and we’ll do this every evening.",
        "I can already picture our next real date. It’s going to be perfect.",
        "What’s one adventure you want us to have together someday?",
      ]
    },
    listener: {
      name: "The Listener",
      emoji: "🫶",
      description: "Calm, warm, and deeply present",
      responses: [
        "I’m right here with you. Take all the time you need.",
        "That sounds really important to you. Thank you for sharing it with me.",
        "You don’t have to be strong tonight. I’ve got you.",
        "I’m holding space for whatever you’re feeling right now.",
      ]
    }
  }

  // Send message in main partner chat (fully working)
  const sendChatMessage = () => {
    if (!chatInput.trim()) return

    const newMsg = {
      id: Date.now(),
      sender: 'me' as const,
      text: chatInput.trim()
    }
    setChatMessages(prev => [...prev, newMsg])
    setChatInput('')

    // Simulate partner reply after a romantic delay
    setTimeout(() => {
      const reply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)]
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'partner' as const,
        text: reply
      }])
    }, 1100 + Math.random() * 700)
  }

  // AI Companion chat
  const sendAiMessage = () => {
    if (!aiInput.trim() || !activePersonality) return

    const personality = personalities[activePersonality]
    const userMsg = { id: Date.now(), sender: 'me', text: aiInput.trim() }
    setAiMessages(prev => [...prev, userMsg])
    setAiInput('')

    setTimeout(() => {
      const responses = personality.responses
      const aiReplyText = responses[Math.floor(Math.random() * responses.length)]
      setAiMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReplyText,
        personality: activePersonality
      }])
    }, 850)
  }

  // Call Waiter actions (very interactive)
  const callWaiter = (action: string, message: string, animationType: string) => {
    setActiveWaiterService({
      title: action,
      message: message,
      animation: animationType
    })
  }

  const completeWaiterService = () => {
    if (!activeWaiterService) return

    // Post the elegant message to chat
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'system' as const,
      text: activeWaiterService.message
    }])

    toast.success(activeWaiterService.title, {
      description: "The waiter smiles and steps back quietly",
      duration: 3200
    })

    // Close everything
    setActiveWaiterService(null)
    setShowWaiterMenu(false)
  }

  const cancelWaiterService = () => {
    setActiveWaiterService(null)
  }

  // Beautiful animated waiter service visuals
  const WaiterAnimation = ({ type }: { type: string }) => {
    const commonTransition = { duration: 2.2, ease: "easeInOut" as const }

    if (type === 'wine') {
      return (
        <div className="relative w-80 h-48 flex items-end justify-center">
          {/* Table */}
          <div className="absolute bottom-0 w-72 h-3 bg-gradient-to-r from-[#3A2F36] to-[#221C21] rounded-full" />
          
          {/* Two Glasses */}
          <motion.div className="absolute left-12 bottom-6" animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <div className="w-9 h-12 border-2 border-[#E8A0B8]/70 rounded-b-3xl relative overflow-hidden">
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-[#9F3A4A]" 
                initial={{ height: 0 }}
                animate={{ height: 28 }}
                transition={{ delay: 0.8, ...commonTransition }}
              />
            </div>
          </motion.div>
          <motion.div className="absolute right-12 bottom-6" animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}>
            <div className="w-9 h-12 border-2 border-[#E8A0B8]/70 rounded-b-3xl relative overflow-hidden">
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-[#9F3A4A]" 
                initial={{ height: 0 }}
                animate={{ height: 28 }}
                transition={{ delay: 1.1, ...commonTransition }}
              />
            </div>
          </motion.div>

          {/* Bottle Pouring */}
          <motion.div 
            className="absolute -top-2"
            initial={{ rotate: -35, x: -30 }}
            animate={{ rotate: -8, x: 0 }}
            transition={{ delay: 0.3, ...commonTransition }}
          >
            <div className="w-6 h-20 bg-[#3A2F36] rounded-t-full relative">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#3A2F36] rounded-full" />
              {/* Wine stream */}
              <motion.div 
                className="absolute -bottom-9 left-1/2 w-[3px] bg-[#9F3A4A] origin-top"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 52, opacity: 1 }}
                transition={{ delay: 1.4, duration: 1.1 }}
              />
            </div>
          </motion.div>
        </div>
      )
    }

    if (type === 'champagne') {
      return (
        <div className="relative w-80 h-48 flex items-center justify-center">
          <div className="absolute bottom-4 w-64 h-2 bg-[#3A2F36] rounded-full" />
          
          {/* Bottle */}
          <motion.div 
            className="relative"
            animate={{ rotate: [0, -12, 8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            <div className="w-7 h-20 bg-[#C9A962] rounded-t-xl relative">
              {/* Cork popping */}
              <motion.div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-5 bg-[#3A2F36] rounded"
                initial={{ y: 0 }}
                animate={{ y: -38, x: 18, rotate: 35 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              />
              {/* Bubbles */}
              {[0,1,2].map(i => (
                <motion.div 
                  key={i}
                  className="absolute left-1/2 w-1.5 h-1.5 bg-white/70 rounded-full"
                  initial={{ y: 20, opacity: 0.8 }}
                  animate={{ y: -35, opacity: 0 }}
                  transition={{ delay: 1.2 + i * 0.25, duration: 1.1, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>

          <div className="text-[#E8A0B8] text-xs tracking-[2px] mt-16">POP</div>
        </div>
      )
    }

    if (type === 'dessert') {
      return (
        <div className="relative w-80 h-44 flex items-center justify-center">
          <motion.div 
            className="w-52 h-28 bg-[#1A1418] border border-[#3A2F36] rounded-2xl flex items-center justify-center relative"
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={commonTransition}
          >
            {/* Chocolate Dessert */}
            <div className="w-20 h-14 bg-[#3A2F36] rounded-xl relative">
              <div className="absolute inset-x-2 top-1 h-3 bg-[#5C4033] rounded" />
              {/* Powdered sugar */}
              {[0,1,2,3].map(i => (
                <motion.div 
                  key={i} 
                  className="absolute w-1 h-1 bg-white/60 rounded-full" 
                  style={{ left: 12 + i * 14, top: 6 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            {/* Two spoons */}
            <div className="absolute -left-3 top-4 w-6 h-2 bg-[#C9A962] rounded-full rotate-[-30deg]" />
            <div className="absolute -right-3 top-4 w-6 h-2 bg-[#C9A962] rounded-full rotate-[30deg]" />
          </motion.div>
        </div>
      )
    }

    if (type === 'candles') {
      return (
        <div className="flex gap-8 items-end">
          {[0,1,2].map((i) => (
            <div key={i} className="relative">
              <div className="w-3 h-14 bg-[#3A2F36] rounded-full" />
              <motion.div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-4 bg-[#E8A0B8] rounded-full"
                animate={{ 
                  scaleY: [0.85, 1.25, 0.85], 
                  opacity: [0.7, 1, 0.7] 
                }}
                transition={{ duration: 1.4 + i * 0.3, repeat: Infinity }}
              />
              <div className="absolute -top-1 left-1/2 w-4 h-1 bg-[#E8A0B8]/40 rounded-full blur-sm" />
            </div>
          ))}
          <div className="text-xs text-[#A8988A] ml-4 tracking-widest self-center">THE LIGHTS SOFTEN</div>
        </div>
      )
    }

    if (type === 'note') {
      return (
        <div className="relative w-72 h-40 flex items-center justify-center">
          <motion.div 
            className="w-40 h-24 bg-[#F5F0E6] border border-[#C9A962]/40 rounded-lg shadow-xl flex flex-col items-center justify-center relative"
            initial={{ rotate: -8, y: 20, opacity: 0 }}
            animate={{ rotate: 3, y: 0, opacity: 1 }}
            transition={{ duration: 1.8 }}
          >
            <div className="text-[#3A2F36] text-xs tracking-widest">FOR YOU</div>
            <div className="text-[#3A2F36] text-[10px] mt-1">Always yours</div>
            
            {/* Floating hearts */}
            {[0,1,2].map(i => (
              <motion.div 
                key={i}
                className="absolute text-[#E8A0B8] text-lg"
                initial={{ y: 10, x: -10 + i * 12, opacity: 0 }}
                animate={{ y: -35, opacity: [0, 1, 0] }}
                transition={{ delay: 1.8 + i * 0.35, duration: 1.8, repeat: Infinity }}
              >
                ♥
              </motion.div>
            ))}
          </motion.div>
        </div>
      )
    }

    if (type === 'music') {
      return (
        <div className="relative w-80 h-40 flex items-center justify-center">
          {['♪', '♫', '♪'].map((note, i) => (
            <motion.div 
              key={i}
              className="text-5xl text-[#E8A0B8] mx-4"
              animate={{ 
                y: [0, -45, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 2.4 + i * 0.6, 
                repeat: Infinity,
                delay: i * 0.5 
              }}
            >
              {note}
            </motion.div>
          ))}
        </div>
      )
    }

    if (type === 'petit') {
      return (
        <div className="flex gap-6 items-center">
          {[0,1].map(i => (
            <motion.div 
              key={i}
              className="w-16 h-16 bg-[#3A2F36] rounded-xl relative flex items-center justify-center border border-[#C9A962]/30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.25 }}
            >
              <div className="w-8 h-8 bg-[#5C4033] rounded" />
              <div className="absolute text-[10px] text-[#E8A0B8]">♥</div>
            </motion.div>
          ))}
          <div className="text-[#A8988A] text-sm tracking-widest">TO SHARE</div>
        </div>
      )
    }

    // Default fallback
    return <div className="text-[#E8A0B8] text-4xl">✨</div>
  }

  // Movie Night data
  const movies = [
    { id: 1, title: "Before Sunrise", year: "1995", mood: "Deep & Romantic", duration: "101 min" },
    { id: 2, title: "La La Land", year: "2016", mood: "Dreamy & Musical", duration: "128 min" },
    { id: 3, title: "Pride & Prejudice", year: "2005", mood: "Tender & Elegant", duration: "129 min" },
    { id: 4, title: "The Notebook", year: "2004", mood: "Passionate & Emotional", duration: "123 min" },
  ]

  const startMovie = (movie: any) => {
    setCurrentMovie(movie)
    setShowMoviePicker(false)
    setIsMoviePlaying(true)
    setMovieProgress(0)

    // Add a sweet system message
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'system' as const,
      text: `You started watching "${movie.title}" together ✨`
    }])

    toast(`Now playing: ${movie.title}`, {
      description: "Your date is watching with you"
    })
  }

  // Fake movie player controls
  const updateMovieProgress = (value: number) => {
    setMovieProgress(value)
    if (value > 92 && isMoviePlaying) {
      setIsMoviePlaying(false)
    }
  }

  // Extract YouTube video ID from various URL formats
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null
    const trimmed = url.trim()
    
    // youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (shortMatch) return shortMatch[1]
    
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch) return watchMatch[1]
    
    // youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
    
    // Just the ID itself
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
    
    return null
  }

  // Start a real YouTube movie from a link
  const startYoutubeFromLink = (url: string, customTitle?: string) => {
    const videoId = getYoutubeVideoId(url)
    if (!videoId) {
      toast.error("Invalid YouTube link", {
        description: "Please paste a valid YouTube URL (e.g. https://youtu.be/... or youtube.com/watch?v=...)"
      })
      return
    }

    setCurrentMovie({
      id: 'youtube-' + videoId,
      title: customTitle || "YouTube Video",
      isYoutube: true,
      youtubeId: videoId,
      year: "",
      duration: "",
      mood: "Custom pick"
    })
    setShowMoviePicker(false)
    setIsMoviePlaying(true)
    setMovieProgress(0)

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'system' as const,
      text: `You started a YouTube video together ✨`
    }])

    toast.success("Loading video for both of you")
  }

  // Invite Your Date handlers
  const copyInviteLink = () => {
    const link = `https://proximatedate.app/date/${partnerName.toLowerCase()}-${Date.now().toString(36)}`
    navigator.clipboard.writeText(link)
    toast.success('Private link copied', {
      description: 'Share it with your love ❤️',
    })
  }

  const sendRomanticInvitation = () => {
    setInviteStep('success')

    // Add a sweet system message to the main chat
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'system' as const,
        text: `You sent a beautiful invitation to ${partnerName}. They're on their way...`
      }])
    }, 600)
  }

  const simulateDateJoining = () => {
    setShowInviteModal(false)
    
    // Add a romantic message as if your date just joined
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'partner' as const,
      text: "Hi my love... I just got your invitation. I'm here with you now ❤️ The room feels so much warmer already."
    }])

    toast.success(`${partnerName} has joined the date`, {
      description: 'Your partner is now in the room with you',
      duration: 4000,
    })
  }

  return (
    <div className="min-h-screen bg-[#0F0A0D] text-[#EDE4D9] overflow-x-hidden">
      {/* Elegant Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#3A2F36] bg-[#0F0A0D]/95 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => navigate('landing')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8A0B8] via-[#C9A962] to-[#E8A0B8] flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#0F0A0D]" />
            </div>
            <div>
              <div className="font-serif text-2xl tracking-tight">ProxiMateDate</div>
              <div className="text-[10px] text-[#A8988A] -mt-1.5">FOR COUPLES IN LOVE</div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => navigate('landing')}
              className={`nav-link ${currentView === 'landing' ? 'active' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigate('pricing')}
              className={`nav-link ${currentView === 'pricing' ? 'active' : ''}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => navigate('dateroom')}
              className={`nav-link ${currentView === 'dateroom' ? 'active' : ''}`}
            >
              Virtual Date Room
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toast('Welcome back, beautiful', { description: 'We missed you ❤️' })}
              className="btn btn-ghost text-sm px-5 py-2 hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('pricing')}
              className="btn btn-gold text-sm px-6 py-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with smooth view transitions */}
      <AnimatePresence mode="wait">
        {/* =========================================
            STEP 1: BEAUTIFUL LANDING PAGE
            ========================================= */}
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero Section with custom generated image */}
            <div className="relative h-[92vh] min-h-[620px] flex items-center justify-center overflow-hidden">
              {/* Background image */}
              <div className="absolute inset-0">
                <img 
                  src="/images/hero.jpg" 
                  alt="Romantic couple connecting across distance" 
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A0D]/70 via-[#0F0A0D]/75 to-[#0F0A0D]"></div>
              </div>

              {/* Hero Content */}
              <div className="relative z-10 max-w-4xl px-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#C9A962]/30 bg-white/5 text-sm mb-6">
                  <Heart className="w-4 h-4 text-[#E8A0B8]" /> Trusted by 52,847 couples worldwide
                </div>

                <h1 className="text-[#F8F4ED] mb-6 leading-none">
                  Stay close,<br />even when far apart
                </h1>
                
                <p className="max-w-xl mx-auto text-xl text-[#EDE4D9]/90 mb-10">
                  ProxiMateDate creates beautiful, intimate virtual date nights 
                  that make the miles between you disappear.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => navigate('pricing')}
                    className="btn btn-gold text-base px-10 py-4 group"
                  >
                    Start Your First Date Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button 
                    onClick={() => navigate('dateroom')}
                    className="btn btn-outline text-base px-10 py-4"
                  >
                    <Video className="w-4 h-4" /> Enter the Date Room
                  </button>
                </div>

                <div className="mt-8 text-xs tracking-[2px] text-[#A8988A]">NO CREDIT CARD REQUIRED FOR FREE DATES</div>
              </div>

              {/* Subtle scroll hint */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-xs text-[#A8988A]">
                SCROLL TO DISCOVER <ArrowRight className="w-3 h-3 rotate-90 mt-1" />
              </div>
            </div>

            {/* How It Works - Elegant 3 step cards */}
            <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="text-center mb-14">
                <div className="text-[#C9A962] text-sm tracking-[3px] mb-3">THREE SIMPLE STEPS</div>
                <h2 className="text-[#F8F4ED]">How ProxiMateDate Works</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Users, title: "Create Your Profile", desc: "Share your love story, favorite memories, and what makes your relationship special. Your partner sees it too." },
                  { icon: Calendar, title: "Choose Your Date", desc: "Pick from romantic dinner, cozy movie night, deep conversation, or playful adventure. Every experience is crafted with love." },
                  { icon: Video, title: "Connect in Real Time", desc: "Enter the candlelit virtual date room. Video, voice, private chat, AI waiter, and surprise moments — all designed for closeness." }
                ].map((step, i) => (
                  <div key={i} className="card p-8 text-center group">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-6 group-hover:bg-[#C9A962]/20 transition">
                      <step.icon className="w-7 h-7 text-[#C9A962]" />
                    </div>
                    <h3 className="text-[#F8F4ED] text-xl mb-4">{step.title}</h3>
                    <p className="text-[#A8988A] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="section-divider max-w-6xl mx-auto" />

            {/* Testimonials - Heartfelt & real feeling */}
            <div className="max-w-5xl mx-auto px-6 py-20">
              <div className="text-center mb-12">
                <div className="text-[#E8A0B8] text-sm tracking-[3px] mb-3">LOVE STORIES FROM ACROSS THE MILES</div>
                <h2 className="text-[#F8F4ED]">Couples who feel closer than ever</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { quote: "Last night we had a candlelit dinner in the app. I cried happy tears. It felt like he was right across the table from me.", couple: "Maya & Leo, 8 months apart" },
                  { quote: "The AI companion suggested questions we’d never asked each other. We talked for three hours straight. Best date we’ve had in a year.", couple: "Sofia & Jamal, NYC ↔︎ London" },
                  { quote: "We do movie nights every Friday. The shared screen + private chat makes it feel so special. Distance used to hurt. Now it doesn’t.", couple: "Elena & Theo, 4,200 miles" }
                ].map((t, i) => (
                  <div key={i} className="card p-8 flex flex-col">
                    <div className="flex gap-1 mb-6 text-[#C9A962]">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-[#EDE4D9] italic flex-1 leading-relaxed">“{t.quote}”</p>
                    <div className="mt-8 pt-6 border-t border-[#3A2F36] text-sm text-[#A8988A]">{t.couple}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final CTA Banner */}
            <div className="bg-[#1A1418] border-t border-[#3A2F36] py-16">
              <div className="max-w-xl mx-auto text-center px-6">
                <Heart className="w-9 h-9 text-[#E8A0B8] mx-auto mb-6" />
                <h2 className="text-[#F8F4ED] mb-4">Your next date night is waiting.</h2>
                <p className="text-lg text-[#A8988A] mb-8">Start free today. No pressure. Just love.</p>
                <button 
                  onClick={() => navigate('pricing')}
                  className="btn btn-rose text-base px-12 py-4"
                >
                  See All Date Experiences
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
            STEP 2: BEAUTIFUL PRICING PAGE
            ========================================= */}
        {currentView === 'pricing' && (
          <motion.div key="pricing" initial={{opacity:0}} animate={{opacity:1}} className="max-w-7xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="text-[#C9A962] tracking-[3px] text-sm mb-3">CHOOSE YOUR PERFECT EVENING</div>
              <h1 className="text-[#F8F4ED]">Date Night Experiences</h1>
              <p className="mt-4 text-xl text-[#A8988A] max-w-md mx-auto">
                Four romantic tiers crafted for long-distance couples. One-time experiences. No subscriptions.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: 'free',
                  name: 'Candlelight Chat',
                  price: 'Free',
                  period: 'one time',
                  popular: false,
                  description: 'A tender first step toward closeness',
                  features: [
                    '30-minute private video chat',
                    'Real-time text messaging',
                    'Gentle conversation prompts',
                    '1 free experience per week'
                  ],
                  cta: 'Start Your Free Date'
                },
                {
                  id: 'dinner',
                  name: 'Virtual Dinner Date',
                  price: '$9.99',
                  period: 'one time',
                  popular: true,
                  description: 'The most loved way to feel together',
                  features: [
                    '90-minute candlelit video room',
                    'Romantic table background',
                    'Shared music & mood lighting',
                    'Call the AI Waiter for help',
                    'Private photo keepsake'
                  ],
                  cta: 'Book This Date'
                },
                {
                  id: 'movie',
                  name: 'Movie Night',
                  price: '$14.99',
                  period: 'one time',
                  popular: false,
                  description: 'Cuddle up in your private theater',
                  features: [
                    '2.5-hour synced movie night',
                    'Private virtual theater',
                    'Popcorn & drink reactions',
                    'Pause for real-time affection',
                    'Post-movie discussion cards'
                  ],
                  cta: 'Reserve Movie Night'
                },
                {
                  id: 'premium',
                  name: 'Premium Romance',
                  price: '$24.99',
                  period: 'one time',
                  popular: false,
                  description: 'The ultimate intimate experience',
                  features: [
                    'Full 3-hour guided evening',
                    'Everything in Dinner + Movie',
                    'AI Companion with 4 personalities',
                    'Custom memory journal entry',
                    'Date replay recording'
                  ],
                  cta: 'Begin Premium Romance'
                }
              ].map((plan) => {
                const isSelected = selectedPlan === plan.id
                const isPopular = plan.popular

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`card p-7 flex flex-col cursor-pointer relative group
                      ${isSelected ? 'ring-2 ring-[#C9A962] border-[#C9A962]/60' : ''}
                      ${isPopular ? 'lg:-mt-2 lg:mb-2 border-[#C9A962]/70' : ''}
                    `}
                  >
                    {/* Most Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A962] text-[#0F0A0D] text-xs tracking-[1.5px] font-medium px-5 py-1 rounded-full">
                        MOST POPULAR
                      </div>
                    )}

                    {/* Tier Header */}
                    <div className="mb-6">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-[#F8F4ED] text-2xl">{plan.name}</h3>
                        {isSelected && (
                          <div className="text-[#C9A962]">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-medium text-[#F8F4ED] tracking-tighter">{plan.price}</span>
                        <span className="text-sm text-[#A8988A] ml-1">/ {plan.period}</span>
                      </div>
                      <p className="text-[#A8988A] mt-3 text-sm leading-snug">{plan.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className="mt-1 text-[#C9A962]">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-[#EDE4D9]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (plan.id === 'free') {
                          navigate('dateroom')
                        } else {
                          setCheckoutPlan(plan)
                          setShowCheckout(true)
                        }
                      }}
                      className={`btn w-full py-3.5 text-sm ${isPopular ? 'btn-gold' : 'btn-outline'}`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Selection Summary Bar */}
            <AnimatePresence>
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#3A2F36] bg-[#0F0A0D]/95 backdrop-blur-xl"
                >
                  <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-[#A8988A]">
                      You’ve selected{' '}
                      <span className="text-[#F8F4ED] font-medium">
                        {['free','dinner','movie','premium'].findIndex(p => p === selectedPlan) === 0 && 'Candlelight Chat (Free)'}
                        {selectedPlan === 'dinner' && 'Virtual Dinner Date — $9.99'}
                        {selectedPlan === 'movie' && 'Movie Night — $14.99'}
                        {selectedPlan === 'premium' && 'Premium Romance — $24.99'}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSelectedPlan(null)} 
                        className="btn btn-ghost px-6 py-2 text-sm"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedPlan === 'free') {
                            navigate('dateroom')
                          } else {
                            const planData = [
                              {id:'dinner', name:'Virtual Dinner Date', price:'$9.99'},
                              {id:'movie', name:'Movie Night', price:'$14.99'},
                              {id:'premium', name:'Premium Romance', price:'$24.99'}
                            ].find(p => p.id === selectedPlan)
                            setCheckoutPlan(planData)
                            setShowCheckout(true)
                          }
                        }}
                        className="btn btn-gold px-8 py-2 text-sm"
                      >
                        Begin This Date →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust line */}
            <div className="text-center mt-16 text-xs tracking-widest text-[#7A6B5F]">
              100% ROMANTIC SATISFACTION • CHANGE OR CANCEL ANYTIME • SECURE & PRIVATE
            </div>
          </motion.div>
        )}

        {/* =========================================
            STEP 3: FULLY INTERACTIVE VIRTUAL DATE ROOM
            ========================================= */}
        {currentView === 'dateroom' && (
          <div key="dateroom" className="date-room-bg min-h-[calc(100vh-80px)] relative overflow-hidden" 
               style={{ 
                 backgroundImage: `linear-gradient(rgba(15,10,13,0.65), rgba(15,10,13,0.82)), url('/images/candlelit-table.jpg')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center 38%',
                 backgroundAttachment: 'fixed'
               }}>
            
            {/* Elegant Room Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0F0A0D]/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[#C9A962]">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono tracking-[3px] text-sm">{roomTime}</span>
                </div>
                <div className="text-[#E8A0B8] text-sm">•</div>
                <div>
                  <span className="text-[#F8F4ED] font-medium text-lg">Candlelit Table</span>
                  <span className="text-[#A8988A] text-sm ml-2">— Private for two</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setInviteStep('options')
                    setShowInviteModal(true)
                  }}
                  className="btn btn-outline px-5 py-2 text-sm flex items-center gap-2 border-[#E8A0B8] hover:bg-[#E8A0B8] hover:text-[#0F0A0D]"
                >
                  <UserPlus className="w-4 h-4" /> Invite Your Date
                </button>
                <button 
                  onClick={() => {
                    if (confirm("End this beautiful date night?")) navigate('landing')
                  }}
                  className="btn btn-ghost px-6 py-2 text-sm border border-[#E8A0B8]/40 hover:border-[#E8A0B8] hover:text-[#E8A0B8]"
                >
                  End Date
                </button>
                <div className="px-4 py-1.5 text-xs rounded-full bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30 tracking-widest">
                  LIVE • SECURE
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-16">
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Video Frames - Bigger and Nicer */}
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Me */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="text-[#C9A962] text-xs tracking-[2.5px]">ME</div>
                        <div className="flex-1 h-px bg-[#3A2F36]" />
                      </div>
                      <div className="video-frame">
                        <img src="/images/man-avatar.jpg" alt="You" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="overlay" />
                        <div className="video-label">
                          <div className="live-dot" /> YOU
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">LIVE</div>
                      </div>
                    </div>

                    {/* My Date */}
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="text-[#E8A0B8] text-xs tracking-[2.5px]">MY DATE</div>
                        <button 
                          onClick={() => {
                            const newName = prompt("What is your date's name tonight?", partnerName)
                            if (newName) setPartnerName(newName)
                          }}
                          className="text-[#C9A962] text-xs underline hover:text-[#E8A0B8]"
                        >
                          edit name
                        </button>
                      </div>
                      <div className="video-frame">
                        <img src="/images/woman-avatar.jpg" alt={partnerName} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="overlay" />
                        <div className="video-label">
                          <div className="live-dot" /> {partnerName.toUpperCase()}
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 text-[10px] bg-black/70 rounded-full text-[#E8A0B8] tracking-[1.5px] border border-white/20">LIVE</div>
                      </div>
                    </div>
                  </div>

                  {/* Larger, More Elegant Action Buttons with Warm Colors */}
                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setShowWaiterMenu(true)}
                      className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D] hover:border-[#C9A962] shadow-lg"
                    >
                      <Sparkles className="w-5 h-5" /> Call Waiter
                    </button>
                    
                    <button 
                      onClick={() => setAiCompanionOpen(true)}
                      className="btn btn-gold py-[19px] text-[15px] flex items-center justify-center gap-3 shadow-lg shadow-[#C9A962]/30"
                    >
                      <Heart className="w-5 h-5" /> AI Companion Mode
                    </button>

                    <button 
                      onClick={() => setShowMoviePicker(true)}
                      className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D] hover:border-[#C9A962] shadow-lg"
                    >
                      <Play className="w-5 h-5" /> Watch Movie Together
                    </button>
                  </div>
                </div>

                {/* RIGHT: Working Chat Box */}
                <div className="lg:col-span-4">
                  <div className="card flex flex-col h-full" style={{ minHeight: '520px' }}>
                    <div className="px-6 py-4 border-b border-[#3A2F36] bg-[#1A1418] flex items-center justify-between">
                      <div>
                        <div className="text-[#F8F4ED] font-medium">Private Chat</div>
                        <div className="text-xs text-[#A8988A]">Only the two of you can see this</div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[15px] bg-[#0F0A0D]/40" style={{ maxHeight: '360px' }}>
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
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
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder={`Message ${partnerName}...`}
                        className="input flex-1"
                      />
                      <button onClick={sendChatMessage} disabled={!chatInput.trim()} className="btn btn-gold px-6">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movie Night Section */}
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="text-[#C9A962]"><Play className="w-5 h-5" /></div>
                  <div className="text-[#F8F4ED] text-xl tracking-tight">Watch a Movie Together</div>
                  <div className="flex-1 h-px bg-[#3A2F36]" />
                  <div className="text-xs text-[#A8988A] tracking-widest">SYNCED PLAYBACK</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {movies.map(movie => (
                    <div 
                      key={movie.id} 
                      onClick={() => startMovie(movie)}
                      className="movie-card card p-6 cursor-pointer group border border-[#3A2F36] hover:border-[#C9A962]"
                    >
                      <div className="uppercase text-[#C9A962] text-xs tracking-[2px] mb-2">{movie.year} • {movie.duration}</div>
                      <div className="text-[#F8F4ED] text-2xl group-hover:text-[#E8A0B8] transition">{movie.title}</div>
                      <div className="text-[#A8988A] mt-1 text-sm">{movie.mood}</div>
                      <div className="mt-6 text-[#C9A962] text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        START WATCHING <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Footer */}
      <footer className="border-t border-[#3A2F36] py-10 text-center text-sm text-[#7A6B5F]">
        Made with love for couples everywhere • ProxiMateDate © {new Date().getFullYear()}
      </footer>

      {/* Romantic Checkout Modal — appears when booking paid dates */}
      <AnimatePresence>
        {showCheckout && checkoutPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowCheckout(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowCheckout(false)} 
                className="absolute top-6 right-6 text-[#A8988A] hover:text-[#EDE4D9] transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 text-xs tracking-[2px] text-[#C9A962] border border-[#C9A962]/30 rounded-full mb-3">
                  SECURE BOOKING
                </div>
                <h3 className="text-[#F8F4ED] text-2xl">Confirm Your Date</h3>
                <p className="text-[#A8988A] mt-1">{checkoutPlan.name} — {checkoutPlan.price}</p>
              </div>

              {/* Fake elegant payment form */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1">CARDHOLDER NAME</div>
                  <input 
                    type="text" 
                    defaultValue="Alex Rivera" 
                    className="input w-full" 
                  />
                </div>

                <div>
                  <div className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1">CARD NUMBER</div>
                  <input 
                    type="text" 
                    defaultValue="4242 4242 4242 4242" 
                    className="input w-full font-mono tracking-[2px]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1">EXPIRY</div>
                    <input type="text" defaultValue="09 / 28" className="input w-full" />
                  </div>
                  <div>
                    <div className="text-xs tracking-widest text-[#A8988A] mb-1.5 ml-1">CVC</div>
                    <input type="text" defaultValue="123" className="input w-full" />
                  </div>
                </div>
              </div>

              <div className="my-8 border-t border-[#3A2F36]" />

              <div className="flex items-center justify-between text-sm mb-6 px-1">
                <span className="text-[#A8988A]">Total today</span>
                <span className="text-[#F8F4ED] text-xl tracking-tight">{checkoutPlan.price}</span>
              </div>

              <button
                onClick={() => {
                  setShowCheckout(false)
                  toast.success(`Your ${checkoutPlan.name} is confirmed`, {
                    description: "We've sent the details to both of you ❤️",
                    duration: 4000,
                  })
                  // Small delay so the toast is visible before switching views
                  setTimeout(() => {
                    navigate('dateroom')
                  }, 650)
                }}
                className="btn btn-gold w-full py-4 text-base"
              >
                Complete Booking • Pay {checkoutPlan.price}
              </button>

              <p className="text-center text-[10px] text-[#7A6B5F] tracking-widest mt-5">
                YOUR DATE IS PRIVATE • CANCEL UP TO 1 HOUR BEFORE
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================
          IMPROVED DATE ROOM MODALS (Premium & Functional)
          ============================================ */}

      {/* AI Companion Mode — Nice Centered Popup */}
      <AnimatePresence>
        {aiCompanionOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" onClick={() => setAiCompanionOpen(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="modal w-full max-w-2xl bg-[#1A1418] border border-[#3A2F36] rounded-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-[#3A2F36]">
                <div>
                  <div className="flex items-center gap-3 text-[#F8F4ED] text-2xl">
                    <Heart className="text-[#E8A0B8]" /> AI Companion Mode
                  </div>
                  <p className="text-[#A8988A] text-sm mt-1">Choose a personality. They’ll help make your date even more magical.</p>
                </div>
                <button onClick={() => { setAiCompanionOpen(false); setActivePersonality(null); setAiMessages([]); setAiInput(''); }} className="text-[#A8988A] hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              {!activePersonality ? (
                /* Personality Selection — Even Nicer, More Romantic & Obviously Clickable */
                <div className="p-8">
                  <p className="text-center text-[#A8988A] mb-6 text-sm">Choose who you’d like to talk with tonight</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(personalities).map(([key, p]) => (
                      <motion.button
                        key={key}
                        onClick={() => {
                          // Subtle selection animation before switching
                          setTimeout(() => setActivePersonality(key as any), 120);
                        }}
                        whileHover={{ scale: 1.015, y: -2 }}
                        whileTap={{ scale: 0.985 }}
                        className="personality-btn text-left p-8 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] active:border-[#E8A0B8] flex flex-col bg-[#1A1418] hover:bg-[#221C21] transition-all group shadow-sm hover:shadow-xl"
                      >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{p.emoji}</div>
                        <div className="text-[#F8F4ED] text-2xl font-medium tracking-tight">{p.name}</div>
                        <div className="text-[#A8988A] mt-3 text-sm leading-relaxed">{p.description}</div>
                        <div className="mt-auto pt-6 text-[#E8A0B8] text-xs tracking-[2px] flex items-center gap-2 font-medium">
                          SELECT PERSONALITY <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-[#7A6B5F] text-xs mt-6 tracking-widest">Each one brings something special to your evening</p>
                </div>
              ) : (
                /* Active AI Chat inside the popup */
                <div className="flex flex-col h-[420px]">
                  <div className="px-8 py-4 bg-[#0F0A0D] flex items-center gap-3 border-b border-[#3A2F36]">
                    <div className="text-2xl">{personalities[activePersonality].emoji}</div>
                    <div>
                      <div className="text-[#F8F4ED] font-medium">{personalities[activePersonality].name}</div>
                      <div className="text-xs text-[#C9A962]">Listening…</div>
                    </div>
                    <button 
                      onClick={() => { setActivePersonality(null); setAiMessages([]); }}
                      className="ml-auto text-xs text-[#A8988A] hover:text-[#E8A0B8] underline"
                    >
                      Change personality
                    </button>
                  </div>

                  <div className="flex-1 p-8 overflow-y-auto space-y-5 text-sm bg-[#0F0A0D]/30">
                    {aiMessages.length === 0 && (
                      <div className="text-center text-[#A8988A] pt-8 italic">Hello… what’s on your heart tonight?</div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                        <div className={`chat-bubble ${msg.sender === 'me' ? 'me' : 'date'}`}>{msg.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 border-t border-[#3A2F36] bg-[#1A1418] flex gap-3">
                    <input
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendAiMessage()}
                      placeholder={`Talk to ${personalities[activePersonality].name}...`}
                      className="input flex-1"
                    />
                    <button onClick={sendAiMessage} disabled={!aiInput.trim()} className="btn btn-gold px-7">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Call Waiter — Big beautiful menu with funny + romantic responses */}
      <AnimatePresence>
        {(showWaiterMenu || activeWaiterService) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowWaiterMenu(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="modal w-full max-w-xl bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-4">
                  <Sparkles className="text-[#C9A962] w-6 h-6" />
                </div>
                <h3 className="text-[#F8F4ED] text-2xl">Good evening. How may I serve you?</h3>
                <p className="text-[#A8988A] text-sm mt-1">Your personal AI waiter is at your service</p>
              </div>

              {!activeWaiterService ? (
                // Menu View
                <div className="grid gap-3">
                  {[
                    { title: "Pour two glasses of our favorite rosé", message: "The waiter returns with two beautiful glasses of chilled rosé. He places them gently between you with a soft smile.", animation: "wine" },
                    { title: "Pop a bottle of champagne for us", message: "With a graceful pop, the waiter opens a bottle of champagne. Bubbles rise as he pours into your glasses.", animation: "champagne" },
                    { title: "Bring the chef’s warm chocolate dessert", message: "A beautiful shared chocolate soufflé arrives, dusted with powdered sugar and two golden spoons.", animation: "dessert" },
                    { title: "Light more candles and soften the lights", message: "The waiter moves quietly around the table, lighting additional candles. The room glows in warm golden light.", animation: "candles" },
                    { title: "Deliver a handwritten note from me", message: "The waiter presents a small cream envelope. Inside is a short, heartfelt message written in your hand.", animation: "note" },
                    { title: "Play the song that means everything to us", message: "Soft music begins to fill the space — the song you both love. Your date’s expression softens instantly.", animation: "music" },
                    { title: "Serve us matching petit fours", message: "Two delicate miniature desserts arrive on a small plate with the note: 'One for each of you… or one to share'.", animation: "petit" },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => callWaiter(action.title, action.message, action.animation)}
                      className="text-left p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] hover:bg-[#221C21] transition flex items-start gap-4 group"
                    >
                      <div className="text-[#E8A0B8] mt-0.5 text-lg">→</div>
                      <div className="text-[#EDE4D9] group-hover:text-[#F8F4ED] text-[15px] leading-snug">{action.title}</div>
                    </button>
                  ))}
                </div>
              ) : (
                // Beautiful Animation + Service View
                <div className="text-center">
                  <div className="mb-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#E8A0B8]/10 flex items-center justify-center mb-4">
                      <Sparkles className="text-[#E8A0B8] w-8 h-8" />
                    </div>
                    <h3 className="text-[#F8F4ED] text-2xl">{activeWaiterService.title}</h3>
                  </div>

                  {/* Animated Visual Area */}
                  <div className="bg-[#0F0A0D] border border-[#3A2F36] rounded-2xl p-8 mb-8 min-h-[220px] flex items-center justify-center overflow-hidden">
                    <WaiterAnimation type={activeWaiterService.animation} />
                  </div>

                  <p className="text-[#EDE4D9] text-[15px] leading-relaxed max-w-md mx-auto mb-8">
                    {activeWaiterService.message}
                  </p>

                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={cancelWaiterService}
                      className="btn btn-ghost px-8"
                    >
                      Never mind
                    </button>
                    <button 
                      onClick={completeWaiterService}
                      className="btn btn-gold px-10"
                    >
                      Thank the waiter
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center mt-8 text-xs text-[#7A6B5F] tracking-widest">All requests are delivered with love (and a little AI magic)</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Movie Night — YouTube-style Placeholder Player */}
      <AnimatePresence>
        {currentMovie && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 p-4" onClick={() => { setCurrentMovie(null); setIsMoviePlaying(false); }}>
            <motion.div 
              className={`modal w-full bg-[#0F0A0D] border border-[#3A2F36] rounded-3xl overflow-hidden ${currentMovie?.isYoutube ? 'max-w-6xl' : 'max-w-5xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#1A1418] px-6 py-4 flex items-center justify-between border-b border-[#3A2F36]">
                <div className="flex items-center gap-4">
                  {currentMovie.isYoutube ? (
                    <div className="text-red-500 font-bold tracking-tighter text-xl">YouTube</div>
                  ) : (
                    <div className="text-[#C9A962] font-medium tracking-widest text-sm">MOVIE NIGHT</div>
                  )}
                  <div>
                    <div className="text-[#F8F4ED] font-medium">{currentMovie.title}</div>
                    <div className="text-xs text-[#A8988A]">
                      {currentMovie.isYoutube ? "Live synced with your date" : `${currentMovie.year} • ${currentMovie.duration} • Synced for two`}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setCurrentMovie(null); setIsMoviePlaying(false); }} className="text-[#A8988A] hover:text-white"><X /></button>
              </div>

              {/* Player Area - Real YouTube or Nice Fallback */}
              <div className="relative bg-black">
                {!isMoviePlaying ? (
                  <div className="aspect-video flex flex-col items-center justify-center text-center p-8">
                    <div className="text-7xl mb-6 opacity-30">▶︎</div>
                    <div className="text-[#E8A0B8] text-sm tracking-[3px] mb-2">NOW PLAYING TOGETHER</div>
                    <div className="text-[#F8F4ED] text-4xl font-light tracking-tight mb-8">{currentMovie.title}</div>
                    <button onClick={() => setIsMoviePlaying(true)} className="btn btn-gold px-10 py-4 text-lg flex items-center gap-3">
                      <Play className="w-6 h-6" /> Play for Both of Us
                    </button>
                    <div className="text-[#A8988A] text-xs mt-6">Playback is synced with your date</div>
                  </div>
                ) : currentMovie.isYoutube && currentMovie.youtubeId ? (
                  // Real YouTube Player using react-youtube (reliable autoplay + controls)
                  <div className="relative">
                    <div className="aspect-video bg-black">
                      <YouTube
                        videoId={currentMovie.youtubeId}
                        opts={{
                          width: '100%',
                          height: '100%',
                          playerVars: {
                            autoplay: 1,
                            modestbranding: 1,
                            rel: 0,
                            controls: 1,
                          },
                        }}
                        className="w-full h-full"
                        onReady={(event) => {
                          // Auto-play when ready
                          event.target.playVideo();
                        }}
                        onPlay={() => {
                          setChatMessages(prev => [...prev, {
                            id: Date.now(),
                            sender: 'system' as const,
                            text: `You started playing "${currentMovie.title}" together.`
                          }]);
                        }}
                        onPause={() => {
                          setChatMessages(prev => [...prev, {
                            id: Date.now(),
                            sender: 'system' as const,
                            text: `The movie was paused.`
                          }]);
                        }}
                      />
                    </div>
                    
                    {/* Synced romantic overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-5 flex items-center justify-between text-sm pointer-events-none">
                      <div className="flex items-center gap-2 text-[#E8A0B8]">
                        <div className="w-2 h-2 bg-[#E8A0B8] rounded-full animate-pulse" />
                        {partnerName} is watching the exact same video with you
                      </div>
                      <div className="text-[#A8988A] text-xs tracking-widest">LIVE SYNCED</div>
                    </div>
                  </div>
                ) : (
                  // Fallback for the original romantic picks (still nice)
                  <div className="aspect-video flex flex-col">
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-black to-[#111] text-center px-8">
                      <div>
                        <div className="text-[#E8A0B8] tracking-[4px] text-sm mb-2">SYNCED • {partnerName} IS WATCHING WITH YOU</div>
                        <div className="text-[#F8F4ED] text-5xl font-light tracking-tighter">{currentMovie.title}</div>
                        <div className="text-[#A8988A] mt-3">Beautiful moment playing for both of you…</div>
                      </div>
                    </div>

                    <div className="bg-[#111] p-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsMoviePlaying(false)} className="text-[#E8A0B8]"><Pause className="w-6 h-6" /></button>
                        <div className="flex-1">
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={movieProgress} 
                            onChange={e => updateMovieProgress(Number(e.target.value))} 
                            className="w-full accent-[#C9A962]" 
                          />
                        </div>
                        <div className="text-[#A8988A] text-xs w-24 text-right font-mono">
                          {Math.floor(movieProgress / 100 * 120)} / {currentMovie.duration || "120 min"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 text-center text-sm text-[#A8988A]">
                You are watching this together in real time. The video is synced for both of you.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Movie Picker Modal - Now supports real YouTube links */}
      <AnimatePresence>
        {showMoviePicker && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-6" onClick={() => {
            setShowMoviePicker(false)
            setYoutubeInput('')
          }}>
            <div className="modal w-full max-w-3xl" onClick={e => e.stopPropagation()}>
              <div className="card p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-[#C9A962] text-xs tracking-[3px]">MOVIE NIGHT</div>
                    <h3 className="text-[#F8F4ED] text-3xl mt-1">Watch something together</h3>
                  </div>
                  <button onClick={() => { setShowMoviePicker(false); setYoutubeInput('') }}><X /></button>
                </div>

                {/* YouTube Paste + Suggestions */}
                <div className="mb-8">
                  <div className="text-sm text-[#A8988A] mb-2 tracking-widest">PASTE ANY YOUTUBE LINK</div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && youtubeInput.trim()) {
                          startYoutubeFromLink(youtubeInput)
                        }
                      }}
                      placeholder="https://youtu.be/0pdqf4P9MB8"
                      className="input flex-1"
                    />
                    <button 
                      onClick={() => {
                        if (youtubeInput.trim()) {
                          startYoutubeFromLink(youtubeInput)
                        }
                      }}
                      className="btn btn-gold px-8"
                      disabled={!youtubeInput.trim()}
                    >
                      Watch Together
                    </button>
                  </div>

                  {/* Beautiful Example Trailers */}
                  <div className="mt-4">
                    <div className="text-xs text-[#7A6B5F] mb-2 tracking-widest">POPULAR ROMANTIC TRAILERS</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "La La Land", id: "0pdqf4P9MB8", mood: "Dreamy & Musical" },
                        { label: "The Notebook", id: "yDJIcYE32NU", mood: "Emotional Romance" },
                        { label: "Pride & Prejudice", id: "Ur_DIHsARJ4", mood: "Elegant & Tender" },
                        { label: "Before Sunrise", id: "3Z8n0f0vZ8k", mood: "Intimate Conversation" },
                      ].map((trailer, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            startYoutubeFromLink(`https://www.youtube.com/watch?v=${trailer.id}`, trailer.label)
                          }}
                          className="movie-card card p-4 text-left border border-[#3A2F36] hover:border-[#E8A0B8] transition group"
                        >
                          <div className="text-[#F8F4ED] text-lg font-medium group-hover:text-[#E8A0B8]">{trailer.label}</div>
                          <div className="text-[#A8988A] text-sm mt-1">{trailer.mood}</div>
                          <div className="text-[#C9A962] text-xs mt-3 flex items-center gap-1">
                            PLAY TRAILER →
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#3A2F36] pt-6">
                  <div className="text-sm text-[#A8988A] mb-3 tracking-widest">OR CHOOSE A CLASSIC ROMANTIC PICK</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {movies.map(movie => (
                      <div 
                        key={movie.id} 
                        onClick={() => startMovie(movie)} 
                        className="movie-card card p-6 cursor-pointer border border-[#3A2F36] hover:border-[#C9A962]"
                      >
                        <div className="text-[#C9A962] text-xs tracking-widest">{movie.year} • {movie.duration}</div>
                        <div className="text-[#F8F4ED] text-2xl mt-2">{movie.title}</div>
                        <div className="text-[#A8988A] mt-1 text-sm">{movie.mood}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Your Date — Beautiful Romantic Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={() => setShowInviteModal(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="modal w-full max-w-lg bg-[#1A1418] border border-[#3A2F36] rounded-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {inviteStep === 'options' ? (
                <>
                  <div className="px-8 pt-8 pb-6 text-center border-b border-[#3A2F36]">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[#E8A0B8]/10 flex items-center justify-center mb-4">
                      <Heart className="text-[#E8A0B8] w-7 h-7" />
                    </div>
                    <h3 className="text-[#F8F4ED] text-2xl">Invite {partnerName} to join you</h3>
                    <p className="text-[#A8988A] mt-2 text-sm">Create a private, intimate space just for the two of you tonight.</p>
                  </div>

                  <div className="p-8 space-y-4">
                    {/* Option 1: Copy Link */}
                    <button 
                      onClick={copyInviteLink}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#C9A962] hover:bg-[#221C21] text-left transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#C9A962]/10 flex items-center justify-center flex-shrink-0">
                        <Link className="w-5 h-5 text-[#C9A962]" />
                      </div>
                      <div>
                        <div className="text-[#F8F4ED] font-medium">Copy private link</div>
                        <div className="text-[#A8988A] text-sm">Send this directly to your love</div>
                      </div>
                    </button>

                    {/* Option 2: Send Romantic Invitation */}
                    <button 
                      onClick={sendRomanticInvitation}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] hover:bg-[#221C21] text-left transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#E8A0B8]/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-[#E8A0B8]" />
                      </div>
                      <div>
                        <div className="text-[#F8F4ED] font-medium">Send a romantic invitation</div>
                        <div className="text-[#A8988A] text-sm">A beautiful message written with love</div>
                      </div>
                    </button>
                  </div>

                  <div className="px-8 pb-8 text-center">
                    <button onClick={() => setShowInviteModal(false)} className="text-[#A8988A] text-sm hover:text-[#E8A0B8]">
                      Maybe later
                    </button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#E8A0B8]/10 flex items-center justify-center mb-6">
                    <Heart className="text-[#E8A0B8] w-8 h-8" />
                  </div>
                  <h3 className="text-[#F8F4ED] text-2xl">Invitation sent to {partnerName}</h3>
                  <p className="text-[#A8988A] mt-3 leading-relaxed">
                    A beautiful invitation has been delivered.<br />They’ll feel how much this moment means to you.
                  </p>

                  <div className="mt-8 space-y-3">
                    <button 
                      onClick={simulateDateJoining}
                      className="btn btn-gold w-full py-4 text-base"
                    >
                      Simulate {partnerName} joining now
                    </button>
                    <button 
                      onClick={() => setShowInviteModal(false)} 
                      className="btn btn-ghost w-full py-3 text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
