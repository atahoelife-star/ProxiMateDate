import { useState } from 'react'
import { Play } from 'lucide-react'
import { WatchStage } from '../components/dateroom/WatchTogether'
import { CompanionMode } from '../components/dateroom/CompanionMode'
import { ArrivalSequence } from '../components/dateroom/ArrivalSequence'
import { useArrivalGate } from '../lib/arrivalGate'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { CINEMA_ARRIVAL } from '../data/arrival'
import { chatMomentForEvening } from '../data/suggestedLines'
import { useDemoChat } from '../lib/demoChat'
import {
  followFromWindow,
  initialWatchId,
  roomFromWindow,
  useRoomClock,
  useRoomQuerySync,
} from '../lib/roomSession'

export function MovieNightPage() {
  const { arrived, markArrived } = useArrivalGate('pd-arrival-cinema')
  const { chatMessages, chatInput, setChatInput, sendChatMessage, pickSuggestedLine, roomMessage } = useDemoChat()
  const [partnerName, setPartnerName] = useState('Emma')
  const roomTime = useRoomClock()
  const [showMoviePicker, setShowMoviePicker] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('watch') === 'open',
  )
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [companionOpen, setCompanionOpen] = useState(false)
  const [roomId] = useState(roomFromWindow)
  const [isFollower] = useState(followFromWindow)
  const [initialVideoId] = useState(initialWatchId)
  const [watchingMovie, setWatchingMovie] = useState(Boolean(initialVideoId))

  useRoomQuerySync(roomId)

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

      <RoomChrome
        title="Movie Night"
        subtitle="Watch Together"
        banner="Preview theater — paste a YouTube link and press Play. Chat floats when a video is playing. Netflix stays on your own apps. Not a live two-person call."
        roomTime={roomTime}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 min-h-[520px]">
            <WatchStage
              roomId={roomId}
              partnerName={partnerName}
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

        <div className="mt-7">
          <button
            type="button"
            onClick={() => setCompanionOpen(true)}
            className="btn btn-outline py-[19px] text-[15px] flex items-center justify-center gap-3 border-[#E8A0B8] hover:bg-[#E8A0B8] hover:text-[#0F0A0D] w-full sm:w-auto px-8"
          >
            <Play className="w-5 h-5" /> Watch on your own apps
          </button>
        </div>
      </div>

      <CompanionMode
        partnerName={partnerName}
        open={companionOpen}
        onClose={() => setCompanionOpen(false)}
        onRoomMessage={roomMessage}
      />

      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={partnerName}
        roomId={roomId}
        invitePath="/movie-night"
        follow
        step={inviteStep}
        onStep={setInviteStep}
      />
    </div>
  )
}
