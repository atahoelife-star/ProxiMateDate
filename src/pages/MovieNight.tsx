import { useEffect, useState } from 'react'
import { WatchStage } from '../components/dateroom/WatchTogether'
import { ArrivalSequence } from '../components/dateroom/ArrivalSequence'
import { useArrivalGate } from '../lib/arrivalGate'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { JoinNameModal } from '../components/dateroom/JoinNameModal'
import { HostRibbon } from '../components/dateroom/HostRibbon'
import { SessionWrapNotice } from '../components/dateroom/SessionWrapNotice'
import { CINEMA_ARRIVAL } from '../data/arrival'
import { chatMomentForEvening } from '../data/suggestedLines'
import {
  initialWatchId,
  roomFromWindow,
  useRoomQuerySync,
} from '../lib/roomSession'
import { usePaidRoom } from '../lib/roomAccess'
import { usePaidDateSession } from '../lib/dateSession'
import { useLiveChat, useLiveSeat } from '../lib/liveRoom'
import { useUsPhotos } from '../lib/datePhotos'
import { RoomPaywall } from '../components/dateroom/RoomPaywall'
import { reportRoomStart } from '../lib/roomStarts'

export function MovieNightPage() {
  const allowed = usePaidRoom('movie')
  if (!allowed) return <RoomPaywall room="movie" />
  return <MovieNightSession />
}

function MovieNightSession() {
  const { arrived, markArrived } = useArrivalGate('pd-arrival-cinema')
  const [roomId] = useState(roomFromWindow)
  const { seat, myName, join, rename, photoScope } = useLiveSeat(roomId)
  const { photos } = useUsPhotos(photoScope)
  const live = useLiveChat(roomId, seat, myName, photos.you, { armClock: seat === 'guest' })
  const session = usePaidDateSession('movie', roomId, arrived, {
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
  const [showMoviePicker, setShowMoviePicker] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('watch') === 'open',
  )
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const isFollower = seat === 'guest'
  const [initialVideoId] = useState(initialWatchId)
  const [watchingMovie, setWatchingMovie] = useState(Boolean(initialVideoId))
  const [wrapDismissed, setWrapDismissed] = useState(false)

  useRoomQuerySync(roomId, session.startedAt > 0 ? { started: String(session.startedAt) } : undefined)

  useEffect(() => {
    if (!arrived) return
    reportRoomStart('movie', roomId)
  }, [arrived, roomId])

  const chatMoment = chatMomentForEvening({
    watching: watchingMovie,
    waiterClip: 'idle',
    myMessageCount: chatMessages.filter((m) => m.sender === 'me').length,
  })

  return (
    <div
      className="date-room-bg min-h-[calc(100vh-80px)] relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15,10,13,0.72), rgba(15,10,13,0.88)), url('/images/arrival/cinema/theater.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {!arrived && <ArrivalSequence beats={CINEMA_ARRIVAL} storageKey="pd-arrival-cinema" onDone={markArrived} />}

      <HostRibbon show={seat === 'host'} />
      <RoomChrome
        title="Movie Night"
        subtitle="Watch Together"
        banner={
          session.expired
            ? 'This movie night has wrapped up. No extra charge — stay as long as you like, or end the date.'
            : session.waiting
              ? `Preview theater — ${session.budgetLabel} starts when your date joins.`
              : session.wrap
                ? `A few minutes left in this ${session.budgetLabel} movie night.`
                : `Preview theater — ${session.budgetLabel} left for both of you. Paste a YouTube link and press Play. Chat floats when a video is playing. Netflix stays on your own apps.`
        }
        roomTime={session.remainingLabel}
        timeHint={session.waiting ? 'starts when they join' : 'left'}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <WatchStage
              roomId={roomId}
              partnerName={dateName}
              initialVideoId={initialVideoId}
              isFollower={isFollower}
              pickerOpen={showMoviePicker}
              onPickerOpenChange={setShowMoviePicker}
              onRoomMessage={roomMessage}
              chatMoment={chatMoment}
              onWatchingChange={setWatchingMovie}
              chat={{
                messages: chatMessages,
                input: chatInput,
                onInputChange: setChatInput,
                onSend: sendChatMessage,
              }}
            />
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
        title="This movie night is wrapping up"
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
        invitePath="/movie-night"
        follow
        startedAt={session.startedAt || undefined}
        step={inviteStep}
        onStep={setInviteStep}
      />
    </div>
  )
}
