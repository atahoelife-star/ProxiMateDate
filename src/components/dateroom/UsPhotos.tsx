import { useRef } from 'react'
import { fileToPhotoDataUrl, useUsPhotos } from '../../lib/datePhotos'

type UsPhotosProps = {
  partnerName: string
}

function Circle({
  src,
  label,
  hint,
  onPick,
}: {
  src: string | null
  label: string
  hint: string
  onPick: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <button
      type="button"
      className="us-photo"
      title={hint}
      aria-label={hint}
      onClick={() => inputRef.current?.click()}
    >
      {src ? <img src={src} alt="" /> : <span>{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onPick(file)
        }}
      />
    </button>
  )
}

/** Optional you + date circles in chat. Never a scene/player tile. */
export function UsPhotos({ partnerName }: UsPhotosProps) {
  const { photos, setPhoto } = useUsPhotos()
  const dateInitial = (partnerName.trim()[0] || 'D').toUpperCase()

  const pick = (who: 'you' | 'date') => (file: File) => {
    void fileToPhotoDataUrl(file)
      .then((dataUrl) => setPhoto(who, dataUrl))
      .catch(() => {})
  }

  return (
    <div className="us-photos" aria-label="You and your date">
      <Circle src={photos.you} label="Y" hint="Add your photo (optional)" onPick={pick('you')} />
      <Circle src={photos.date} label={dateInitial} hint={`Add ${partnerName}'s photo (optional)`} onPick={pick('date')} />
    </div>
  )
}
