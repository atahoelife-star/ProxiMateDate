import { useEffect, useRef, useState } from 'react'
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
import { formatPrice, orderTotal, type OrderLine } from '../data/menus'
import {
  clipForLatest,
  clipForOrder,
  clipForTable,
  clipToPlay,
  isMyServeSeat,
  mineToServe,
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
import { reportRoomStart } from '../lib/roomStarts'
import { useDateFeedback } from '../lib/useDateFeedback'
import { DateFeedbackPrompt } from '../components/DateFeedbackPrompt'

export function RestaurantDatePage() {
  const allowed = usePaidRoom('dinner')
  if (!allowed) return <RoomPaywall room="dinner" />
  return <RestaurantDateSession />
}

function RestaurantDateSession() {
  const { phase, look, lookId, finishTour, pickLook, finishLead, changeRoom, stayHere, forceTour, mustEnterThroughDoors } =
    useRestaurantEntry()
  const navigate = useNavigate()
  const { muted: diningMuted, toggleMute: toggleDiningMute, fadeOutAndStop } = useDiningAmbience(phase === 'room')
  const [roomId] = useState(roomFromWindow)
  const { seat, myName, join, rename, photoScope } = useLiveSeat(roomId)
  const { photos } = useUsPhotos(photoScope)
  const live = useLiveChat(roomId, seat, myName, photos.you, { armClock: seat === 'guest' })
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
  const feedback = useDateFeedback({
    room: 'dinner',
    roomId,
    startedAt: session.startedAt,
    expired: session.expired,
    waiting: session.waiting,
    plan: session.combo ? 'premium' : 'dinner',
  })

  const [youOrder, setYouOrder] = useState<OrderLine[]>([])
  const [tableOrder, setTableOrder] = useState<OrderLine[]>([])
  const [waiterClip, setWaiterClip] = useState<WaiterClip>('idle')
  const [waiterServing, setWaiterServing] = useState(false)
  const [waiterPlayId, setWaiterPlayId] = useState(0)
  const [waiterNote, setWaiterNote] = useState('In the dining room')
  const waiterPresenceRef = useRef<WaiterClip>('idle')
  const [waiterStage, setWaiterStage] = useState<WaiterClip>('idle')

  useRoomQuerySync(roomId, session.startedAt > 0 ? { started: String(session.startedAt) } : undefined)

  useEffect(() => {
    if (phase !== 'room') return
    reportRoomStart('dinner', roomId)
  }, [phase, roomId])

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
    else if (full.seat === 'table') setTableOrder((prev) => [...prev, full])

    if (isMyServeSeat(full.seat)) {
      const clip = clipForOrder(full)
      const who = full.seat === 'table' ? 'the table' : 'you'
      playWaiter(
        clip,
        WAITER_CLIPS[clip].label,
        `The waiter brings ${full.name} for ${who} (${full.restaurantName})${full.side ? ` with ${full.side}` : ''}. Demo only — nothing is cooked or charged.`,
      )
    }
  }

  const removeOrderLine = (lineId: string) => {
    setYouOrder((prev) => prev.filter((l) => l.lineId !== lineId))
    setTableOrder((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: waiterServing ? waiterClip : waiterStage,
    myMessageCount: chatMessages.filter((m) => m.sender === 'me').length,
  })

  const myPlate = mineToServe(youOrder, tableOrder)

  const sendTableToWaiter = () => {
    if (myPlate.length === 0) {
      toast.message('Nothing to serve yet', { description: 'Add dishes from your menu first. Their plate plays on their screen.' })
      return
    }
    const clip = clipForTable(myPlate)
    const summary = myPlate.map((l) => `${l.name} (${l.restaurantName})`).join('; ')
    playWaiter(
      clip,
      'Serving your plate',
      `The waiter brings your order: ${summary}. Total ${formatPrice(orderTotal(myPlate))} — demo only, no kitchen, no card.`,
    )
    setShowWaiterMenu(false)
  }

  const openWaiter = () => {
    setShowWaiterMenu(true)
    if (myPlate.length === 0) {
      playWaiter('greet', 'Waiter at the table', 'The waiter welcomes you at the table.')
      return
    }
    const line = myPlate[myPlate.length - 1]
    const clip = clipForLatest(myPlate)
    playWaiter(
      clip,
      WAITER_CLIPS[clip].label,
      `The waiter brings ${line.name} (${line.restaurantName}).`,
    )
  }

  const waiterActions: { title: string; message: string; clip: WaiterClip }[] = [
    {
      title: 'Greet us at the table',
      message: 'The waiter comes to your table, welcomes you both, and makes sure you are seated.',
      clip: 'greet',
    },
    {
      title: 'Pour two glasses of our favorite rosé',
      message: 'Wine is poured for the table. The waiter video plays beside you — not a CSS bottle.',
      clip: 'wine',
    },
    {
      title: 'Pop a bottle of champagne for us',
      message: 'The waiter pops a bottle, lets it spray, then pours into a glass.',
      clip: 'champagne',
    },
  ]

  return (
    <div
      className={`date-room-bg min-h-[calc(100vh-80px)] relative ${phase === 'room' ? 'date-room-seated overflow-x-hidden' : 'overflow-hidden'}`}
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.55), rgba(15,10,13,0.78)), url('${lookThumb(look)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <HostRibbon show={seat === 'host'} />
      {phase === 'tour' && (
        <ArrivalSequence beats={RESTAURANT_ARRIVAL} storageKey="pd-arrival-restaurant" forcePlay={forceTour} onDone={finishTour} />
      )}
      {phase === 'choose' && (
        <RestaurantRoomChooser
          onPick={pickLook}
          currentId={lookId}
          onStay={lookId && !mustEnterThroughDoors ? stayHere : undefined}
        />
      )}
      {phase === 'lead' && <HostLeadIn key={look.id} look={look} onDone={finishLead} />}

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
                : `Preview restaurant — ${session.budgetLabel} left for both of you. Each of you orders on your own screen. Waiter clips are serving videos, not a webcam.`
        }
        roomTime={session.remainingLabel}
        timeHint={session.waiting ? 'starts when they join' : 'left'}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
        sound={{ muted: diningMuted, onToggle: toggleDiningMute }}
        onEnd={() => feedback.requestEnd(() => fadeOutAndStop(() => navigate('/')))}
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

        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            onClick={openWaiter}
            className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#C9A962] hover:bg-[#C9A962] hover:text-[#0F0A0D] w-full sm:w-auto px-8"
          >
            <Sparkles className="w-5 h-5" /> Call Waiter
          </button>
          <a href="#dinner-menus" className="text-[#C9A962] underline text-sm text-center sm:text-left">
            Verdant Ember and Silver Sage menus
          </a>
        </div>

        <DinnerMenus
          partnerName={dateName}
          youOrder={youOrder}
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
                  Your starter, entrée, and dessert — the serving video matches the dish you ordered. Their dishes play on their screen.
                </p>
              </div>
              {myPlate.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs tracking-widest text-[#C9A962] mb-3">SERVE WHAT YOU ORDERED</div>
                  <div className="grid gap-2 mb-3">
                    {myPlate.map((line) => {
                      const clip = clipForOrder(line)
                      return (
                        <button
                          key={line.lineId}
                          type="button"
                          onClick={() => {
                            playWaiter(
                              clip,
                              WAITER_CLIPS[clip].label,
                              `The waiter brings ${line.name} (${line.restaurantName}).`,
                            )
                            setShowWaiterMenu(false)
                          }}
                          className="text-left p-4 rounded-2xl border border-[#C9A962]/40 hover:border-[#C9A962] hover:bg-[#221C21] transition"
                        >
                          <div className="text-[#EDE4D9] text-[15px]">{line.name}</div>
                          <div className="text-[#A8988A] text-xs mt-1">
                            {line.course === 'appetizer' ? 'Starter' : line.course === 'entree' ? 'Entrée' : 'Dessert'}
                            {' · '}
                            {line.restaurantName}
                            {' · '}
                            {WAITER_CLIPS[clip].label}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" className="btn btn-gold w-full mb-4 py-3" onClick={sendTableToWaiter}>
                    Serve everything you ordered
                  </button>
                </div>
              )}
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
              <WaiterQuickOrder partnerName={dateName} onAdd={addOrderLine} />
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
      <DateFeedbackPrompt
        open={feedback.open}
        room="dinner"
        plan={feedback.plan}
        onFinish={feedback.finish}
      />
      </>
      )}
    </div>
  )
}
