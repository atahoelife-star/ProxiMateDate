import { useCallback, useEffect, useState } from 'react'

const KEY = 'pd-us-photos'
const CHANGE = 'pd-us-photos'
const SIZE = 192

export type UsPhotosState = {
  you: string | null
  date: string | null
}

function empty(): UsPhotosState {
  return { you: null, date: null }
}

export function readUsPhotos(): UsPhotosState {
  if (typeof window === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(KEY)
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

export function writeUsPhotos(next: UsPhotosState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
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

export function useUsPhotos() {
  const [photos, setPhotos] = useState<UsPhotosState>(readUsPhotos)

  useEffect(() => {
    const sync = () => setPhotos(readUsPhotos())
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGE, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGE, sync)
    }
  }, [])

  const setPhoto = useCallback((who: 'you' | 'date', dataUrl: string | null) => {
    const next = { ...readUsPhotos(), [who]: dataUrl }
    writeUsPhotos(next)
    setPhotos(next)
  }, [])

  return { photos, setPhoto }
}
