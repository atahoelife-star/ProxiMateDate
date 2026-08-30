import { Link } from 'react-router-dom'
import { Clock, UserPlus, Volume2, VolumeX } from 'lucide-react'

type RoomChromeProps = {
  title: string
  subtitle: string
  banner: string
  roomTime: string
  onInvite: () => void
  sound?: { muted: boolean; onToggle: () => void }
  onEnd?: () => void
}

export function RoomChrome({ title, subtitle, banner, roomTime, onInvite, sound, onEnd }: RoomChromeProps) {
  return (
    <>
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-[#C9A962] text-[#0F0A0D] text-sm text-center tracking-wide">
        {banner}
      </div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-white/10 bg-[#0F0A0D]/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[#C9A962]">
            <Clock className="w-4 h-4" />
            <span className="font-mono tracking-[3px] text-sm">{roomTime}</span>
          </div>
          <div className="text-[#E8A0B8] text-sm">•</div>
          <div>
            <span className="text-[#F8F4ED] font-medium text-lg">{title}</span>
            <span className="text-[#A8988A] text-sm ml-2">— {subtitle}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {sound && (
            <button
              type="button"
              onClick={sound.onToggle}
              className="btn btn-ghost px-4 py-2 text-sm flex items-center gap-2 border border-white/15"
              aria-pressed={sound.muted}
              aria-label={sound.muted ? 'Unmute dining room' : 'Mute dining room'}
            >
              {sound.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {sound.muted ? 'Sound off' : 'Room sound'}
            </button>
          )}
          <button
            type="button"
            onClick={onInvite}
            className="btn btn-outline px-5 py-2 text-sm flex items-center gap-2 border-[#E8A0B8] hover:bg-[#E8A0B8] hover:text-[#0F0A0D]"
          >
            <UserPlus className="w-4 h-4" /> Invite Your Date
          </button>
          {onEnd ? (
            <button type="button" onClick={onEnd} className="btn btn-ghost px-6 py-2 text-sm border border-[#E8A0B8]/40">
              End Date
            </button>
          ) : (
            <Link to="/" className="btn btn-ghost px-6 py-2 text-sm border border-[#E8A0B8]/40">
              End Date
            </Link>
          )}
          <div className="px-4 py-1.5 text-xs rounded-full bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30 tracking-widest">
            DEMO • PREVIEW
          </div>
        </div>
      </div>
    </>
  )
}
