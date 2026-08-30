import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { DinnerMenus } from '../components/dateroom/DinnerMenus'
import { WaiterVideoTile } from '../components/dateroom/WaiterVideoTile'
import { ArrivalSequence } from '../components/dateroom/ArrivalSequence'
import { RestaurantRoomChooser } from '../components/dateroom/RestaurantRoomChooser'
import { HostLeadIn } from '../components/dateroom/HostLeadIn'
import { lookBackdrop, lookThumb, useRestaurantEntry } from '../lib/restaurantLook'
import { useDiningAmbience } from '../lib/diningAmbience'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { JoinNameModal } from '../components/dateroom/JoinNameModal'
import { HostRibbon } from '../components/dateroom/HostRibbon'
import { SessionWrapNotice } from '../components/dateroom/SessionWrapNotice'
import { WaiterQuickOrder } from '../components/dateroom/WaiterQuickOrder'
import { RESTAURANT_ARRIVAL } from '../data/arrival'
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
import { roomFromWindow, useRoomQuerySync } from '../lib/roomSession'
import { usePaidRoom } from '../lib/roomAccess'
import { usePaidDateSession } from '../lib/dateSession'
import { useLiveChat, useLiveSeat } from '../lib/liveRoom'
import { useUsPhotos } from '../lib/datePhotos'
import { RoomPaywall } from '../components/dateroom/RoomPaywall'

export function RestaurantDatePage() {
  const allowed = usePaidRoom('dinner')
  if (!allowed) return <RoomPaywall room="dinner" />
  return <RestaurantDateSession />
}

function RestaurantDateSession() {
  const { phase, look, lookId, finishTour, pickLook, finishLead, changeRoom, stayHere } = useRestaurantEntry()
  const navigate = useNavigate()
  const { muted: diningMuted, toggleMute: toggleDiningMute, fadeOutAndStop } = useDiningAmbience(phase === 'room')
  const [roomId] = useState(roomFromWindow)
  const { seat, myName, join, rename, photoScope } = useLiveSeat(roomId)
  const { photos } = useUsPhotos(photoScope)
  const live = useLiveChat(roomId, seat, myName, photos.you, { armClock: seat === 'guest' && phase === 'room' })
  const session = usePaidDateSession('dinner', roomId, phase === 'room', {
    isHost: seat === 'host',
    remoteStartedAt: live.remoteStartedAt,
  })
  const dateName = live.partnerName || 'your date'
  const {
    chatMessages,
    chatInput,
    setChatInput,
    sendChatMessage,
    pickSuggestedLine,
    roomMessage,
  } = live
  const [showWaiterMenu, setShowWaiterMenu] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [wrapDismissed, setWrapDismissed] = useState(false)

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

  useRoomQuerySync(roomId, session.startedAt > 0 ? { started: String(session.startedAt) } : undefined)

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
    const who = full.seat === 'table' ? 'the table' : full.seat === 'you' ? 'you' : dateName
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

  const dessertClipForTable = () => {
    const desserts = [...youOrder, ...partnerOrder, ...tableOrder].filter((line) => line.course === 'dessert')
    return desserts.length > 0 ? clipForTable(desserts) : 'dessert'
  }

  return (
    <div
      className={`date-room-bg min-h-[calc(100vh-80px)] relative overflow-hidden${phase === 'room' ? ' date-room-seated' : ''}`}
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.55), rgba(15,10,13,0.78)), url('${lookThumb(look)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <HostRibbon show={seat === 'host'} />
      {phase === 'tour' && (
        <ArrivalSequence beats={RESTAURANT_ARRIVAL} storageKey="pd-arrival-restaurant" onDone={finishTour} />
      )}
      {phase === 'choose' && (
        <RestaurantRoomChooser
          onPick={pickLook}
          currentId={lookId}
          onStay={lookId ? stayHere : undefined}
        />
      )}
      {phase === 'lead' && <HostLeadIn look={look} onDone={finishLead} />}

      {phase === 'room' && (
      <>
      <RoomChrome
        title="Restaurant Date"
        subtitle="Two kitchens, one table"
        banner={
          session.expired
            ? 'This dinner has wrapped up. No extra charge — stay as long as you like, or end the date.'
            : session.waiting
              ? `Preview restaurant — ${session.budgetLabel} starts when your date joins.`
              : session.wrap
                ? `A few minutes left in this ${session.budgetLabel} dinner.`
                : `Preview restaurant — ${session.budgetLabel} left for both of you. Orders stay in this browser. Waiter clips are serving videos, not a webcam.`
        }
        roomTime={session.remainingLabel}
        timeHint={session.waiting ? 'starts when they join' : 'left'}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
        sound={{ muted: diningMuted, onToggle: toggleDiningMute }}
        onEnd={() => fadeOutAndStop(() => navigate('/'))}
        onChangeRoom={() => {
          setWaiterServing(false)
          setWaiterClip('idle')
          changeRoom()
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
              idleBackdrop={lookBackdrop(look)}
            />
            <p className="text-center text-xs text-[#A8988A] mt-3">{waiterNote}</p>
          </div>

          <div className="lg:col-span-5">
            <PrivateChatPanel
              partnerName={dateName}
              myName={myName}
              onRename={() => {
                const next = window.prompt('Your name tonight?', myName)
                if (next) rename(next)
              }}
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={sendChatMessage}
              moment={chatMoment}
              onPickLine={pickSuggestedLine}
              photoScope={photoScope}
              partnerPhoto={live.partnerPhoto}
              onYouPhoto={live.sendPhoto}
            />
          </div>
        </div>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => {
              setShowWaiterMenu(true)
              playWaiter('greet', 'Waiter at the table', 'The waiter steps into frame.')
            }}
            className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D] w-full sm:w-auto px-8"
          >
            <Sparkles className="w-5 h-5" /> Call Waiter
          </button>
        </div>

        <DinnerMenus
          partnerName={dateName}
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
                      const clip = action.title.startsWith('Set the plates') && all.length > 0
                        ? clipForTable(all)
                        : action.title.startsWith('Bring dessert')
                          ? dessertClipForTable()
                          : action.clip
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
                partnerName={dateName}
                onAdd={addOrderLine}
              />
              <div className="text-center mt-8 text-xs text-[#7A6B5F] tracking-widest">Demo service — local state only</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SessionWrapNotice
        open={session.isHost && session.wrap && !wrapDismissed}
        title="This dinner is wrapping up"
        body={`You have about ${session.remainingLabel} left of your ${session.budgetLabel}. No extra charge unless you later ask to extend. Your date is not billed.`}
        onDismiss={() => setWrapDismissed(true)}
      />

      <JoinNameModal
        open={!myName}
        onSave={(name) => {
          void join(name)
        }}
        photoScope={photoScope}
        onYouPhoto={live.sendPhoto}
      />
      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={dateName}
        roomId={roomId}
        invitePath="/restaurant"
        follow
        startedAt={session.startedAt || undefined}
        step={inviteStep}
        onStep={setInviteStep}
      />
      </>
      )}
    </div>
  )
}
