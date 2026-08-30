import { Send } from 'lucide-react'
import type { ChatMsg } from '../../lib/demoChat'
import type { ChatMoment } from '../../data/suggestedLines'
import { SuggestedLines } from './SuggestedLines'
import { UsPhotos } from './UsPhotos'

type PrivateChatPanelProps = {
  partnerName: string
  onRename: () => void
  messages: ChatMsg[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  moment: ChatMoment
  onPickLine: (line: string) => void
  minHeight?: string
}

export function PrivateChatPanel({
  partnerName,
  onRename,
  messages,
  input,
  onInputChange,
  onSend,
  moment,
  onPickLine,
  minHeight = '520px',
}: PrivateChatPanelProps) {
  return (
    <div className="card flex flex-col h-full" style={{ minHeight }}>
      <div className="px-4 py-2.5 border-b border-[#3A2F36] bg-[#1A1418]">
        <div className="flex items-center gap-2.5">
          <UsPhotos partnerName={partnerName} />
          <div className="min-w-0 flex-1">
            <div className="text-[#F8F4ED] font-medium leading-tight">Private Chat</div>
            <div className="text-[11px] text-[#A8988A] leading-tight">Demo replies. Not a live messenger.</div>
          </div>
          <button type="button" onClick={onRename} className="text-[#C9A962] text-xs underline hover:text-[#E8A0B8] shrink-0">
            {partnerName}
          </button>
        </div>
      </div>
      <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[15px] bg-[#0F0A0D]/40" style={{ maxHeight: '360px' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`chat-bubble ${msg.sender === 'me' ? 'me' : msg.sender === 'partner' ? 'date' : 'system'}`}>
              {msg.sender === 'system' && <span className="block text-[#C9A962] text-xs mb-1 tracking-wider">THE ROOM</span>}
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#3A2F36] bg-[#1A1418]">
        <SuggestedLines moment={moment} onPick={onPickLine} />
        <div className="p-4 pt-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder={`Message ${partnerName}...`}
            className="input flex-1"
          />
          <button type="button" onClick={onSend} disabled={!input.trim()} className="btn btn-gold px-6">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
