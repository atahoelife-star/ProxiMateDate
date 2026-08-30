import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Heart, Send, Sparkles, X } from 'lucide-react'
import { DinnerMenus } from '../components/dateroom/DinnerMenus'
import { WaiterVideoTile } from '../components/dateroom/WaiterVideoTile'
import { ArrivalSequence } from '../components/dateroom/ArrivalSequence'
import { RestaurantRoomChooser } from '../components/dateroom/RestaurantRoomChooser'
import { lookThumb, useRestaurantEntry } from '../lib/restaurantLook'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { WaiterQuickOrder } from '../components/dateroom/WaiterQuickOrder'
import { RESTAURANT_ARRIVAL } from '../data/arrival'
import { personalities, type PersonalityId } from '../data/aiCompanion'
import { formatPrice, orderTotal, type OrderLine, type RestaurantId } from '../data/menus'
import {
  clipForOrder,
  clipForTable,
  clipToPlay,
  presenceAfterService,
  WAITER_CLIPS,
  type WaiterClip,
} from '../data/waiterClips'
import { chatMomentForEvening } from '../data/suggestedLines'
import { useDemoChat } from '../lib/demoChat'
import { roomFromWindow, useRoomClock, useRoomQuerySync } from '../lib/roomSession'

export function RestaurantDatePage() {
  const { phase, look, finishTour, pickLook } = useRestaurantEntry()
  const { chatMessages, chatInput, setChatInput, sendChatMessage, pickSuggestedLine, roomMessage } = useDemoChat()
  const [partnerName, setPartnerName] = useState('Emma')
  const roomTime = useRoomClock()
  const [aiCompanionOpen, setAiCompanionOpen] = useState(false)
  const [activePersonality, setActivePersonality] = useState<PersonalityId | null>(null)
  const [aiMessages, setAiMessages] = useState<{ id: number; sender: string; text: string }[]>([])
  const [aiInput, setAiInput] = useState('')
  const [showWaiterMenu, setShowWaiterMenu] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [roomId] = useState(roomFromWindow)

  const [youRestaurant, setYouRestaurant] = useState<RestaurantId>('verdant-ember')
  const [partnerRestaurant, setPartnerRestaurant] = useState<RestaurantId>('silver-sage')
  const [youOrder, setYouOrder] = useState<OrderLine[]>([])
  const [partnerOrder, setPartnerOrder] = useState<OrderLine[]>([])
  const [tableOrder, setTableOrder] = useState<OrderLine[]>([])
  const [waiterClip, setWaiterClip] = useState<WaiterClip>('idle')
  const [waiterServing, setWaiterServing] = useState(false)
  const [waiterPlayId, setWaiterPlayId] = useState(0)
  const [waiterNote, setWaiterNote] = useState('In the dining room')
  const waiterPresenceRef = useRef<WaiterClip>('idle')
  const [waiterStage, setWaiterStage] = useState<WaiterClip>('idle')

  useRoomQuerySync(roomId)

  const playWaiter = (requested: WaiterClip, note: string, chat?: string) => {
    const play = clipToPlay(waiterPresenceRef.current, requested)
    const next = presenceAfterService(waiterPresenceRef.current, play)
    waiterPresenceRef.current = next
    setWaiterStage(next)
    setWaiterClip(play)
    setWaiterServing(true)
    setWaiterPlayId((id) => id + 1)
    setWaiterNote(note)
    if (chat) roomMessage(chat)
  }

  const settleWaiter = (finished: WaiterClip) => {
    const next = presenceAfterService(waiterPresenceRef.current, finished)
    waiterPresenceRef.current = next
    setWaiterStage(next)
    setWaiterServing(false)
    setWaiterClip('idle')
    setWaiterNote(WAITER_CLIPS[next].presenceLabel)
  }

  const addOrderLine = (line: Omit<OrderLine, 'lineId'>) => {
    const full: OrderLine = { ...line, lineId: `${line.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
    if (full.seat === 'you') setYouOrder((prev) => [...prev, full])
    else if (full.seat === 'partner') setPartnerOrder((prev) => [...prev, full])
    else setTableOrder((prev) => [...prev, full])

    const clip = clipForOrder(full)
    const who = full.seat === 'table' ? 'the table' : full.seat === 'you' ? 'you' : partnerName
    playWaiter(
      clip,
      WAITER_CLIPS[clip].label,
      `The waiter brings ${full.name} for ${who} (${full.restaurantName})${full.side ? ` with ${full.side}` : ''}. Demo only — nothing is cooked or charged.`,
    )
  }

  const removeOrderLine = (lineId: string) => {
    setYouOrder((prev) => prev.filter((l) => l.lineId !== lineId))
    setPartnerOrder((prev) => prev.filter((l) => l.lineId !== lineId))
    setTableOrder((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: waiterServing ? waiterClip : waiterStage,
    myMessageCount: chatMessages.filter((m) => m.sender === 'me').length,
  })

  const sendAiMessage = () => {
    if (!aiInput.trim() || !activePersonality) return
    const personality = personalities[activePersonality]
    const userMsg = { id: Date.now(), sender: 'me', text: aiInput.trim() }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput('')
    window.setTimeout(() => {
      const responses = personality.responses
      const aiReplyText = responses[Math.floor(Math.random() * responses.length)]
      setAiMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReplyText }])
    }, 850)
  }

  const sendTableToWaiter = () => {
    const all = [...youOrder, ...partnerOrder, ...tableOrder]
    if (all.length === 0) {
      toast.message('Nothing to serve yet', { description: 'Add dishes from either menu first.' })
      return
    }
    const clip = clipForTable(all)
    const summary = all.map((l) => `${l.name} (${l.restaurantName})`).join('; ')
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
      message: 'Champagne is poured. Watch the live waiter at your table.',
      clip: 'champagne',
    },
    {
      title: 'Set the plates from both kitchens',
      message: 'Plates from The Verdant Ember and The Silver Sage can land on the same table.',
      clip: 'vegan',
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
        backgroundImage: `linear-gradient(rgba(15,10,13,0.55), rgba(15,10,13,0.78)), url('${lookThumb(look)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {phase === 'tour' && (
        <ArrivalSequence beats={RESTAURANT_ARRIVAL} storageKey="pd-arrival-restaurant" onDone={finishTour} />
      )}
      {phase === 'choose' && <RestaurantRoomChooser onPick={pickLook} />}

      {phase === 'room' && (
      <>
      <RoomChrome
        title="Restaurant Date"
        subtitle="Two kitchens, one table"
        banner="Preview restaurant — not a live two-person call. Orders stay in this browser. Waiter clips are serving videos, not a webcam. LIVE idle is a seated 1x dining room."
        roomTime={roomTime}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col min-h-[520px]">
            <WaiterVideoTile
              clip={waiterClip}
              serving={waiterServing}
              playId={waiterPlayId}
              onServiceEnded={settleWaiter}
            />
            <p className="text-center text-xs text-[#A8988A] mt-3">{waiterNote}</p>
          </div>

          <div className="lg:col-span-5">
            <PrivateChatPanel
              partnerName={partnerName}
              onRename={() => {
                const next = window.prompt("What is your date's name tonight?", partnerName)
                if (next) setPartnerName(next)
              }}
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={sendChatMessage}
              moment={chatMoment}
              onPickLine={pickSuggestedLine}
            />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      const all = [...youOrder, ...partnerOrder, ...tableOrder]
                      const clip = action.title.startsWith('Set the plates') && all.length > 0 ? clipForTable(all) : action.clip
                      playWaiter(clip, action.title, action.message)
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
                        onClick={() => setActivePersonality(key as PersonalityId)}
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
                    <button
                      type="button"
                      onClick={() => {
                        setActivePersonality(null)
                        setAiMessages([])
                      }}
                      className="ml-auto text-xs text-[#A8988A] underline"
                    >
                      Change personality
                    </button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto space-y-5 text-sm">
                    {aiMessages.length === 0 && (
                      <div className="text-center text-[#A8988A] pt-8 italic">Hello… what’s on your heart tonight?</div>
                    )}
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

      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={partnerName}
        roomId={roomId}
        invitePath="/restaurant"
        follow={false}
        step={inviteStep}
        onStep={setInviteStep}
      />
      </>
      )}
    </div>
  )
}
