import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { JoinNameModal } from '../components/dateroom/JoinNameModal'
import { HostRibbon } from '../components/dateroom/HostRibbon'
import { WaitlistForm } from '../components/WaitlistForm'
import { chatMomentForEvening } from '../data/suggestedLines'
import { followFromWindow, roomFromWindow, useRoomQuerySync } from '../lib/roomSession'
import { clearFreeClock, freeClockIsDeadOnEntry, useFreeDateSession } from '../lib/dateSession'
import { useLiveChat, useLiveSeat } from '../lib/liveRoom'
import { useUsPhotos } from '../lib/datePhotos'
import { startStripeCheckout } from '../lib/stripeCheckout'
import { newRoomId } from '../lib/watchSync'
import { reportRoomStart } from '../lib/roomStarts'
import { useDateFeedback } from '../lib/useDateFeedback'
import { DateFeedbackPrompt } from '../components/DateFeedbackPrompt'

/** Free Date Night is never behind Stripe/Premium. Only restaurant and movie night gate on pay. */
export function FreeDateNightPage() {
  const [roomId, setRoomId] = useState(() => {
    const id = roomFromWindow()
    if (freeClockIsDeadOnEntry(id, { isHost: !followFromWindow() })) {
      clearFreeClock(id)
      return newRoomId()
    }
    return id
  })
  const recycle = useCallback(() => {
    clearFreeClock(roomId)
    setRoomId(newRoomId())
  }, [roomId])
  return <FreeDateNightRoom key={roomId} roomId={roomId} onRecycle={recycle} />
}

function FreeDateNightRoom({ roomId, onRecycle }: { roomId: string; onRecycle: () => void }) {
  const navigate = useNavigate()
  const { seat, myName, join, rename, photoScope } = useLiveSeat(roomId)
  const { photos } = useUsPhotos(photoScope)
  const live = useLiveChat(roomId, seat, myName, photos.you, { armClock: seat === 'guest' })
  const session = useFreeDateSession(roomId, {
    isHost: seat === 'host',
    remoteStartedAt: live.remoteStartedAt,
    remoteExtraMs: live.remoteExtraMs,
  })
  const dateName = live.partnerName || 'your date'
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [busy, setBusy] = useState(false)
  const [waitlist, setWaitlist] = useState(false)
  const [checkoutError, setCheckoutError] = useState(false)
  const [dismissedExtraMs, setDismissedExtraMs] = useState<number | null>(null)
  const sawRunning = useRef(false)
  const feedback = useDateFeedback({
    room: 'free',
    roomId,
    startedAt: session.startedAt,
    expired: session.expired,
    waiting: session.waiting,
    plan: session.extraMs > 0 ? 'extend' : 'free',
  })

  useRoomQuerySync(roomId, session.startedAt > 0 ? { started: String(session.startedAt) } : undefined)

  useEffect(() => {
    if (!myName) return
    reportRoomStart('free', roomId)
  }, [myName, roomId])

  useEffect(() => {
    if (!session.waiting && !session.expired) sawRunning.current = true
  }, [session.waiting, session.expired])

  useEffect(() => {
    if (followFromWindow()) return
    if (!session.expired) return
    if (sawRunning.current) return
    onRecycle()
  }, [onRecycle, session.expired])

  useEffect(() => {
    if (session.extraMs > 0) live.sendExtend(session.extraMs)
    // extraMs is the shared extend; live identity changes every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.extraMs])

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: 'idle',
    myMessageCount: live.chatMessages.filter((m) => m.sender === 'me').length,
  })

  const payExtend = async () => {
    setBusy(true)
    setCheckoutError(false)
    const qs = typeof window !== 'undefined' ? window.location.search : ''
    const result = await startStripeCheckout('extend', {
      returnTo: `/date-night${qs}`,
      cancelTo: `/date-night${qs}`,
    })
    setBusy(false)
    if (result === 'waitlist') setWaitlist(true)
    if (result === 'error') setCheckoutError(true)
  }

  const showHostPay = session.isHost && !session.waiting && (session.warn || session.expired)
  const showHostOffer =
    session.isHost && !session.waiting && session.warn && !session.expired && dismissedExtraMs !== session.extraMs

  const saveName = (name: string) => {
    void join(name)
  }

  return (
    <div
      className="date-room-bg min-h-[calc(100vh-80px)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.7), rgba(15,10,13,0.86)), url('/images/candlelit-table.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 38%',
        backgroundAttachment: 'fixed',
      }}
    >
      <HostRibbon show={seat === 'host'} />
      <RoomChrome
        title="Free Date Night"
        subtitle="Simple together time"
        banner={
          session.expired
            ? 'Free 30 minutes is up.'
            : session.waiting
              ? 'Free for 30 minutes. The clock starts when your date joins — not when you open the room.'
              : session.warn
                ? `About ${session.remainingLabel} left in the free 30 minutes.`
                : 'Free for 30 minutes. Remaining time counts down for both of you.'
        }
        roomTime={session.remainingLabel}
        timeHint={session.waiting ? 'starts when they join' : 'left'}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
        onEnd={() => feedback.requestEnd(() => navigate('/'))}
        onExtend={showHostPay ? payExtend : undefined}
        extendLabel={busy ? 'Opening Stripe…' : 'Extend $2.99'}
      />

      {session.expired ? (
        <div className="relative z-10 max-w-lg mx-auto px-6 py-16 text-center">
          <h2 className="text-[#F8F4ED] text-3xl mb-3">This free date night has ended</h2>
          {session.isHost ? (
            <>
              <p className="text-[#A8988A] text-sm mb-6">
                Pay $2.99 with a card in the browser to keep talking. We do not send you to PayPal, Venmo, or Cash App.
              </p>
              {waitlist ? (
                <div className="card p-6 text-left">
                  <p className="text-[#A8988A] text-sm mb-4">
                    Leave your email and we’ll follow up.
                  </p>
                  <WaitlistForm intent="extend-waitlist" plan="extend" submitLabel="Join the waitlist" />
                </div>
              ) : (
                <>
                  {checkoutError && (
                    <p className="text-[#E8A0B8] text-sm mb-4">Couldn’t open Stripe. Tap Extend $2.99 to try again.</p>
                  )}
                  <button type="button" className="btn btn-gold px-8 py-3" disabled={busy} onClick={payExtend}>
                    {busy ? 'Opening Stripe…' : 'Extend $2.99'}
                  </button>
                </>
              )}
            </>
          ) : (
            <p className="text-[#A8988A] text-sm">The host can extend. You’re not billed from this screen.</p>
          )}
          <div className="mt-8">
            <Link to="/" className="text-[#C9A962] underline text-sm">
              Back home
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 pt-10 pb-16">
          <p className="text-center text-[#A8988A] mb-6 text-sm">
            {live.linked ? `You’re live with ${dateName}.` : 'Invite your date with the room link. Chat waits for them — not a bot.'}{' '}
            {session.waiting
              ? 'The 30:00 countdown waits until they open the invite.'
              : 'Remaining time counts down for both of you.'}{' '}
            Tap the You and Date circles to add optional photos.
          </p>
          <PrivateChatPanel
            partnerName={dateName}
            myName={myName}
            onRename={() => {
              const next = window.prompt('Your name tonight?', myName)
              if (next) rename(next)
            }}
            messages={live.chatMessages}
            input={live.chatInput}
            onInputChange={live.setChatInput}
            onSend={live.sendChatMessage}
            moment={chatMoment}
            onPickLine={live.pickSuggestedLine}
            minHeight="560px"
            photoScope={photoScope}
            partnerPhoto={live.partnerPhoto}
            onYouPhoto={live.sendPhoto}
          />
        </div>
      )}

      {showHostOffer && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4">
          <div className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8">
            <h3 className="text-[#F8F4ED] text-2xl mb-2">About three minutes left</h3>
            <p className="text-[#A8988A] text-sm mb-6">
              Extend this free date night for $2.99 so you don’t get cut off at 30:00. Pay with a card on Stripe. We do not send you to PayPal, Venmo, or Cash App. Your date is not billed.
            </p>
            {waitlist ? (
              <WaitlistForm intent="extend-waitlist" plan="extend" submitLabel="Join the waitlist" />
            ) : (
              <>
                {checkoutError && (
                  <p className="text-[#E8A0B8] text-sm mb-3">Couldn’t open Stripe. Tap Extend $2.99 to try again.</p>
                )}
                <button type="button" className="btn btn-gold w-full py-3 mb-3" disabled={busy} onClick={payExtend}>
                  {busy ? 'Opening Stripe…' : 'Extend $2.99'}
                </button>
              </>
            )}
            <button type="button" className="btn btn-ghost w-full py-2 text-sm" onClick={() => setDismissedExtraMs(session.extraMs)}>
              Keep the timer
            </button>
          </div>
        </div>
      )}

      <JoinNameModal
        open={!myName}
        onSave={saveName}
        photoScope={photoScope}
        onYouPhoto={live.sendPhoto}
      />

      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={dateName}
        roomId={roomId}
        invitePath="/date-night"
        follow
        startedAt={session.startedAt || undefined}
        step={inviteStep}
        onStep={setInviteStep}
      />
      <DateFeedbackPrompt
        open={feedback.open}
        room="free"
        plan={feedback.plan}
        onFinish={feedback.finish}
      />
    </div>
  )
}
