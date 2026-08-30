import { useCallback, useEffect, useState } from 'react'

const CHANGE = 'pd-us-photos'
const SIZE = 192

export type UsPhotosState = {
  you: string | null
  date: string | null
}

function empty(): UsPhotosState {
  return { you: null, date: null }
}

function storageKey(scope: string) {
  return `pd-us-photos:${scope}`
}

export function readUsPhotos(scope = 'shared'): UsPhotosState {
  if (typeof window === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(storageKey(scope)) ?? (scope === 'shared' ? localStorage.getItem('pd-us-photos') : null)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<UsPhotosState>
    return {
      you: typeof parsed.you === 'string' ? parsed.you : null,
      date: typeof parsed.date === 'string' ? parsed.date : null,
    }
  } catch {
    return empty()
  }
}

export function writeUsPhotos(next: UsPhotosState, scope = 'shared') {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new Event(CHANGE))
}

export function fileToPhotoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not an image'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas'))
        return
      }
      const scale = Math.max(SIZE / img.width, SIZE / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.84))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}

export function useUsPhotos(scope = 'shared') {
  const [photos, setPhotos] = useState<UsPhotosState>(() => readUsPhotos(scope))

  useEffect(() => {
    const sync = () => setPhotos(readUsPhotos(scope))
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGE, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGE, sync)
    }
  }, [scope])

  const setPhoto = useCallback(
    (who: 'you' | 'date', dataUrl: string | null) => {
      const next = { ...readUsPhotos(scope), [who]: dataUrl }
      writeUsPhotos(next, scope)
      setPhotos(next)
    },
    [scope],
  )

  return { photos, setPhoto }
}
