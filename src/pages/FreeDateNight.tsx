import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { JoinNameModal } from '../components/dateroom/JoinNameModal'
import { HostRibbon } from '../components/dateroom/HostRibbon'
import { WaitlistForm } from '../components/WaitlistForm'
import { chatMomentForEvening } from '../data/suggestedLines'
import { roomFromWindow, useRoomQuerySync } from '../lib/roomSession'
import { applyRemoteFreeClock, useFreeDateSession } from '../lib/dateSession'
import { readSeatName, seatFromWindow, useLiveChat, writeSeatName } from '../lib/liveRoom'
import { startStripeCheckout } from '../lib/stripeCheckout'

export function FreeDateNightPage() {
  const navigate = useNavigate()
  const [roomId] = useState(roomFromWindow)
  const seat = seatFromWindow()
  const [myName, setMyName] = useState(() => readSeatName(roomId, seat))
  const session = useFreeDateSession(roomId)
  const live = useLiveChat(roomId, seat, myName, { startedAt: session.startedAt, extraMs: session.extraMs })
  applyRemoteFreeClock(roomId, live.remoteStartedAt, live.remoteExtraMs)
  const dateName = live.partnerName || 'your date'
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [busy, setBusy] = useState(false)
  const [waitlist, setWaitlist] = useState(false)
  const [dismissedExtraMs, setDismissedExtraMs] = useState<number | null>(null)

  useRoomQuerySync(roomId, session.isHost ? { started: String(session.startedAt) } : undefined)

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: 'idle',
    myMessageCount: live.chatMessages.filter((m) => m.sender === 'me').length,
  })

  const payExtend = async () => {
    setBusy(true)
    const result = await startStripeCheckout('extend', { returnTo: '/date-night', cancelTo: '/date-night' })
    setBusy(false)
    if (result === 'waitlist') setWaitlist(true)
  }

  const showHostPay = session.isHost && (session.warn || session.expired)
  const showHostOffer =
    session.isHost && session.warn && !session.expired && dismissedExtraMs !== session.extraMs

  const saveName = (name: string) => {
    writeSeatName(roomId, seat, name)
    setMyName(name)
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
      <HostRibbon show={session.isHost} />
      <RoomChrome
        title="Free Date Night"
        subtitle="Simple together time"
        banner={
          session.expired
            ? 'Free 30 minutes is up.'
            : session.warn
              ? `About ${session.remainingLabel} left in the free 30 minutes.`
              : 'Free for 30 minutes. Remaining time is on the clock.'
        }
        roomTime={session.remainingLabel}
        timeHint="left"
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
        onEnd={() => navigate('/')}
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
                    Stripe Checkout is not configured on this deploy. Leave an email. No card on this page.
                  </p>
                  <WaitlistForm intent="extend-waitlist" plan="extend" submitLabel="Join the waitlist" />
                </div>
              ) : (
                <button type="button" className="btn btn-gold px-8 py-3" disabled={busy} onClick={payExtend}>
                  {busy ? 'Opening Stripe…' : 'Extend $2.99'}
                </button>
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
            Remaining time counts down for both of you.
          </p>
          <PrivateChatPanel
            partnerName={dateName}
            myName={myName}
            onRename={() => {
              const next = window.prompt('Your name tonight?', myName)
              if (next) saveName(next)
            }}
            messages={live.chatMessages}
            input={live.chatInput}
            onInputChange={live.setChatInput}
            onSend={live.sendChatMessage}
            moment={chatMoment}
            onPickLine={live.pickSuggestedLine}
            minHeight="560px"
            photoScope={`${roomId}-${seat}`}
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
              Extend this free date night for $2.99 so you don’t get cut off at 30:00. Card on Stripe Checkout — not PayPal, Venmo, or Cash App. Your date is not billed.
            </p>
            {waitlist ? (
              <WaitlistForm intent="extend-waitlist" plan="extend" submitLabel="Join the waitlist" />
            ) : (
              <button type="button" className="btn btn-gold w-full py-3 mb-3" disabled={busy} onClick={payExtend}>
                {busy ? 'Opening Stripe…' : 'Extend $2.99'}
              </button>
            )}
            <button type="button" className="btn btn-ghost w-full py-2 text-sm" onClick={() => setDismissedExtraMs(session.extraMs)}>
              Keep the timer
            </button>
          </div>
        </div>
      )}

      <JoinNameModal open={!myName} onSave={saveName} />

      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={dateName}
        roomId={roomId}
        invitePath="/date-night"
        follow
        startedAt={session.startedAt}
        step={inviteStep}
        onStep={setInviteStep}
      />
    </div>
  )
}
