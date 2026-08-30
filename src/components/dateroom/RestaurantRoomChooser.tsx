import { lookThumb, RESTAURANT_LOOKS } from '../../lib/restaurantLook'
import { primeHostVoice } from '../../lib/hostVoice'

type RestaurantRoomChooserProps = {
  onPick: (id: string) => void
  currentId?: string | null
  onStay?: () => void
}

export function RestaurantRoomChooser({ onPick, currentId, onStay }: RestaurantRoomChooserProps) {
  const returning = Boolean(currentId && onStay)

  return (
    <div className="fixed inset-0 z-[190] bg-[#0F0A0D]/92 flex items-end sm:items-center justify-center p-4 sm:p-8" role="dialog" aria-label="Choose a dining room">
      <div className="w-full max-w-4xl">
        <h2 className="text-[#F8F4ED] text-center text-2xl sm:text-3xl mb-2">Which dining room?</h2>
        <p className="text-[#A8988A] text-center text-sm mb-6">
          {returning
            ? 'Tap another room. The host will walk you in. This table stays until you pick.'
            : 'Tap the room you want to sit in. The host will walk you in. You can come back and pick another later.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RESTAURANT_LOOKS.map((beat) => {
            const selected = beat.id === currentId
            return (
              <button
                key={beat.id}
                type="button"
                onClick={() => {
                  primeHostVoice()
                  onPick(beat.id)
                }}
                className={`group relative aspect-[4/5] min-h-[140px] sm:min-h-[180px] rounded-xl overflow-hidden border focus:outline-none ${
                  selected
                    ? 'border-[#C9A962] ring-1 ring-[#C9A962]/60'
                    : 'border-white/15 hover:border-[#C9A962] focus:border-[#C9A962]'
                }`}
              >
                <img src={lookThumb(beat)} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent" />
                {selected && (
                  <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] tracking-widest text-[#0F0A0D] bg-[#C9A962]/90 rounded-full py-1">
                    THIS TABLE
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {returning && (
          <div className="text-center mt-6">
            <button type="button" className="btn btn-ghost text-sm px-6 py-2 border border-white/20" onClick={onStay}>
              Stay at this table
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
