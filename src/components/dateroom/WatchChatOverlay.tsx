import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

export type RoomChatMsg = { id: number; sender: 'me' | 'partner' | 'system'; text: string }

type WatchChatOverlayProps = {
  messages: RoomChatMsg[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  partnerName: string
  liftForControls?: boolean
}

export function WatchChatOverlay({
  messages,
  input,
  onInputChange,
  onSend,
  partnerName,
  liftForControls = true,
}: WatchChatOverlayProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div
      className={`absolute right-3 z-30 w-[min(16.5rem,74%)] max-h-[55%] flex flex-col rounded-2xl bg-[#0F0A0D]/80 border border-white/20 backdrop-blur-md pointer-events-auto ${liftForControls ? 'bottom-12' : 'bottom-3'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div ref={listRef} className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`chat-bubble overlay-chat ${msg.sender === 'me' ? 'me' : msg.sender === 'partner' ? 'date' : 'system'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex gap-1 p-2 border-t border-white/10"
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Message ${partnerName}…`}
          className="input flex-1 text-xs py-1.5 px-2 min-w-0"
          aria-label={`Message ${partnerName}`}
        />
        <button type="submit" disabled={!input.trim()} className="btn btn-gold px-2 py-1.5 shrink-0" aria-label="Send">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
