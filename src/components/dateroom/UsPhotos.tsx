import { useRef } from 'react'
import { fileToPhotoDataUrl, useUsPhotos } from '../../lib/datePhotos'

type UsPhotosProps = {
  partnerName: string
  scope?: string
  partnerPhoto?: string | null
  onYouPhoto?: (dataUrl: string) => void
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

/** Optional 48px you + date circles in chat. Never a scene/player tile. */
export function UsPhotos({ partnerName, scope = 'shared', partnerPhoto, onYouPhoto }: UsPhotosProps) {
  const { photos, setPhoto } = useUsPhotos(scope)
  const dateInitial = (partnerName.trim()[0] || 'D').toUpperCase()
  const dateSrc = partnerPhoto || photos.date

  return (
    <div className="us-photos" aria-label="You and your date">
      <Circle
        src={photos.you}
        label="Y"
        hint="Add your photo (optional)"
        onPick={(file) => {
          void fileToPhotoDataUrl(file)
            .then((dataUrl) => {
              setPhoto('you', dataUrl)
              onYouPhoto?.(dataUrl)
            })
            .catch(() => {})
        }}
      />
      <Circle
        src={dateSrc}
        label={dateInitial}
        hint={`Add ${partnerName || 'your date'}'s photo (optional)`}
        onPick={(file) => {
          void fileToPhotoDataUrl(file)
            .then((dataUrl) => setPhoto('date', dataUrl))
            .catch(() => {})
        }}
      />
    </div>
  )
}
