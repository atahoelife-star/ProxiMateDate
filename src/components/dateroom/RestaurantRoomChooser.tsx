import { RESTAURANT_ARRIVAL } from '../../data/arrival'
import { lookThumb } from '../../lib/restaurantLook'

type RestaurantRoomChooserProps = {
  onPick: (id: string) => void
}

export function RestaurantRoomChooser({ onPick }: RestaurantRoomChooserProps) {
  return (
    <div className="fixed inset-0 z-[190] bg-[#0F0A0D]/92 flex items-end sm:items-center justify-center p-4 sm:p-8" role="dialog" aria-label="Choose a dining room">
      <div className="w-full max-w-4xl">
        <h2 className="text-[#F8F4ED] text-center text-2xl sm:text-3xl mb-2">Which dining room?</h2>
        <p className="text-[#A8988A] text-center text-sm mb-6">Tap the room you want to sit in. It stays for the meal.</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {RESTAURANT_ARRIVAL.map((beat) => (
            <button
              key={beat.id}
              type="button"
              onClick={() => onPick(beat.id)}
              className="group relative aspect-[4/5] min-h-[140px] sm:min-h-[180px] rounded-xl overflow-hidden border border-white/15 hover:border-[#C9A962] focus:outline-none focus:border-[#C9A962]"
            >
              <img src={lookThumb(beat)} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
