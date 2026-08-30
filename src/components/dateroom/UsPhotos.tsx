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
  emptyLabel,
  hint,
  onPick,
}: {
  src: string | null
  emptyLabel: string
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
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span className="us-photo-empty">
          <span className="us-photo-plus" aria-hidden>
            +
          </span>
          {emptyLabel}
        </span>
      )}
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
  const dateSrc = partnerPhoto || photos.date

  return (
    <div className="us-photos" aria-label="Optional photos of you and your date">
      <div className="us-photo-slot">
        <Circle
          src={photos.you}
          emptyLabel="You"
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
        <span className="us-photo-caption">You</span>
      </div>
      <div className="us-photo-slot">
        <Circle
          src={dateSrc}
          emptyLabel="Date"
          hint={`Add ${partnerName || 'your date'}'s photo (optional)`}
          onPick={(file) => {
            void fileToPhotoDataUrl(file)
              .then((dataUrl) => setPhoto('date', dataUrl))
              .catch(() => {})
          }}
        />
        <span className="us-photo-caption">Date</span>
      </div>
    </div>
  )
}
