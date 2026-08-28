import { useState } from 'react'
import { RoomChrome } from '../components/dateroom/RoomChrome'
import { PrivateChatPanel } from '../components/dateroom/PrivateChatPanel'
import { InviteDateModal } from '../components/dateroom/InviteDateModal'
import { chatMomentForEvening } from '../data/suggestedLines'
import { useDemoChat } from '../lib/demoChat'
import { roomFromWindow, useRoomClock, useRoomQuerySync } from '../lib/roomSession'

export function FreeDateNightPage() {
  const { chatMessages, chatInput, setChatInput, sendChatMessage, pickSuggestedLine } = useDemoChat()
  const [partnerName, setPartnerName] = useState('Emma')
  const roomTime = useRoomClock()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'options' | 'success'>('options')
  const [roomId] = useState(roomFromWindow)

  useRoomQuerySync(roomId)

  const chatMoment = chatMomentForEvening({
    watching: false,
    waiterClip: 'idle',
    myMessageCount: chatMessages.filter((m) => m.sender === 'me').length,
  })

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
      <RoomChrome
        title="Free Date Night"
        subtitle="Simple together time"
        banner="A basic chat preview. No menus, no movie player, not a live call."
        roomTime={roomTime}
        onInvite={() => {
          setInviteStep('options')
          setShowInviteModal(true)
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <p className="text-center text-[#A8988A] mb-6 text-sm">
          Sit together and talk. Restaurant and movie night live on their own pages.
        </p>
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
          minHeight="560px"
        />
      </div>

      <InviteDateModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        partnerName={partnerName}
        roomId={roomId}
        invitePath="/date-night"
        follow={false}
        step={inviteStep}
        onStep={setInviteStep}
      />
    </div>
  )
}
