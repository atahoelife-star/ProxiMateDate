import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import type { ChatMoment } from '../../data/suggestedLines'
import { SuggestedLines } from './SuggestedLines'
import { UsPhotos } from './UsPhotos'

export type RoomChatMsg = { id: number; sender: 'me' | 'partner' | 'system'; text: string }

type WatchChatOverlayProps = {
  messages: RoomChatMsg[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  partnerName: string
  liftForControls?: boolean
  variant?: 'overlay' | 'panel'
  caption?: string
  moment?: ChatMoment
}

export function WatchChatOverlay({
  messages,
  input,
  onInputChange,
  onSend,
  partnerName,
  liftForControls = true,
  variant = 'overlay',
  caption,
  moment = 'movie',
}: WatchChatOverlayProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const thread = (
    <div ref={listRef} className={`flex-1 overflow-y-auto min-h-0 ${variant === 'panel' ? 'p-4 space-y-3' : 'px-2.5 py-2 space-y-1.5'}`}>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
          <div className={`chat-bubble overlay-chat ${msg.sender === 'me' ? 'me' : msg.sender === 'partner' ? 'date' : 'system'}`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  )

  const pickLine = (line: string) => {
    if (input.trim() === line) onSend()
    else onInputChange(line)
  }

  const composer = (
    <div className="border-t border-white/10">
      <SuggestedLines moment={moment} onPick={pickLine} compact={variant === 'overlay'} />
      <form
        className={`flex gap-2 ${variant === 'panel' ? 'p-3 pt-1.5' : 'p-2 pt-1 gap-1'}`}
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Message ${partnerName}…`}
          className={`input flex-1 min-w-0 ${variant === 'panel' ? 'py-2.5 px-3' : 'text-xs py-1.5 px-2'}`}
          aria-label={`Message ${partnerName}`}
        />
        <button type="submit" disabled={!input.trim()} className={`btn btn-gold shrink-0 ${variant === 'panel' ? 'px-5 py-2.5' : 'px-2 py-1.5'}`} aria-label="Send">
          <Send className={variant === 'panel' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        </button>
      </form>
    </div>
  )

  if (variant === 'panel') {
    return (
      <div className="h-full min-h-[280px] flex flex-col rounded-2xl bg-[#1A1418] border border-[#3A2F36]">
        <div className="px-3 py-2 border-b border-[#3A2F36]">
          <div className="flex items-center gap-2.5">
            <UsPhotos partnerName={partnerName} />
            <div className="min-w-0">
              <div className="text-[#F8F4ED] font-medium leading-tight">Date chat</div>
              <div className="text-[11px] text-[#A8988A] leading-tight">{caption ?? 'Keep talking here in the date room.'}</div>
            </div>
          </div>
        </div>
        {thread}
        {composer}
      </div>
    )
  }

  return (
    <div
      className={`absolute right-3 z-30 w-[min(16.5rem,74%)] max-h-[55%] flex flex-col rounded-2xl bg-[#0F0A0D]/80 border border-white/20 backdrop-blur-md pointer-events-auto ${liftForControls ? 'bottom-12' : 'bottom-3'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 pt-1.5 pb-1 flex items-center">
        <UsPhotos partnerName={partnerName} />
      </div>
      {thread}
      {composer}
    </div>
  )
}
