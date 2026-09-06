import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrivalSequence } from '../components/dateroom/ArrivalSequence'
import { CarnivalPreviewGate } from '../components/dateroom/CarnivalPreviewGate'
import { CarnivalStage } from '../components/dateroom/CarnivalStage'
import { HostRibbon } from '../components/dateroom/HostRibbon'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { JoinNameModal } from '../components/dateroom/JoinNameModal'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { SessionWrapNotice } from '../components/dateroom/SessionWrapNotice'
import { DateFeedbackPrompt } from '../components/DateFeedbackPrompt'
import { CARNIVAL_ARRIVAL } from '../data/arrival'
import { MIDWAY_STILL, PARK_NAME } from '../data/carnival'
import { chatMomentForEvening } from '../data/suggestedLines'
import { useArrivalGate } from '../lib/arrivalGate'
import { useCarnivalAmbience } from '../lib/carnivalAmbience'
import { useCarnivalPreview } from '../lib/carnivalAccess'
import { useCarnivalSession } from '../lib/carnivalSession'
import { useUsPhotos } from '../lib/datePhotos'
import { useLiveChat, useLiveSeat } from '../lib/liveRoom'
import { roomFromWindow, useRoomQuerySync } from '../lib/roomSession'
import { useDateFeedback } from '../lib/useDateFeedback'

const CARNIVAL_INVITE_PARAMS = { paid: '1' }

export function CarnivalPage() {
  const { allowed, enterPreview } = useCarnivalPreview()
  if (!allowed) return <CarnivalPreviewGate onEnter={enterPreview} />
  return <CarnivalSession />
}

function CarnivalSession() {
  const navigate = useNavigate()
  const { arrived, markArrived } = useArrivalGate('pd-arrival-carnival')
  const { muted, toggleMute, fadeOutAndStop } = useCarnivalAmbience(arrived)
  const [roomId] = useState(roomFromWindow)
  const { seat, myName, join, rename, photoScope } = useLiveSeat(roomId)
  const { photos } = useUsPhotos(photoScope)
  const live = useLiveChat(roomId, seat, myName, photos.you, { armClock: seat === 'guest' })
  const session = useCarnivalSession(roomId, {
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
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [wrapDismissed, setWrapDismissed] = useState(false)
  const feedback = useDateFeedback({
    room: 'carnival',
    roomId,
    startedAt: session.startedAt,
    expired: session.expired,
    waiting: session.waiting,
    plan: '',
  })

  useRoomQuerySync(roomId, {
    paid: '1',
    ...(session.startedAt > 0 ? { started: String(session.startedAt) } : {}),
  })

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: 'idle',
    myMessageCount: chatMessages.filter((m) => m.sender === 'me').length,
    fair: true,
  })

  return (
    <div
      className="date-room-bg min-h-[calc(100vh-80px)] relative overflow-x-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.68), rgba(15,10,13,0.88)), url('${MIDWAY_STILL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {!arrived && (
        <ArrivalSequence beats={CARNIVAL_ARRIVAL} storageKey="pd-arrival-carnival" onDone={markArrived} />
      )}

      <HostRibbon show={seat === 'host'} />
      <RoomChrome
        title={PARK_NAME}
        subtitle="Preview midway"
        banner={
          session.expired
            ? 'This preview evening has wrapped. No charge — stay as long as you like, or end the date.'
            : session.waiting
              ? `Preview only — ${session.budgetLabel} starts when your date joins. No Stripe on this room.`
              : session.wrap
                ? `A few minutes left in this ${session.budgetLabel} preview.`
                : `Preview only — ${session.budgetLabel} left for both of you. No charge. Walk the midway, ride, then come back.`
        }
        roomTime={session.remainingLabel}
        timeHint={session.waiting ? 'starts when they join' : 'left'}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
        sound={{ muted, onToggle: toggleMute }}
        onEnd={() => feedback.requestEnd(() => fadeOutAndStop(() => navigate('/')))}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <CarnivalStage onRoomMessage={roomMessage} />
          </div>
          <div className="lg:col-span-4">
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
      </div>

      <SessionWrapNotice
        open={session.isHost && session.wrap && !wrapDismissed}
        title="This preview evening is wrapping up"
        body={`You have about ${session.remainingLabel} left of your ${session.budgetLabel} preview. No charge. Your date is not billed.`}
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
        invitePath="/carnival"
        follow
        extraParams={CARNIVAL_INVITE_PARAMS}
        startedAt={session.startedAt || undefined}
        step={inviteStep}
        onStep={setInviteStep}
      />
      <DateFeedbackPrompt
        open={feedback.open}
        room="carnival"
        plan={feedback.plan}
        onFinish={feedback.finish}
      />
    </div>
  )
}
