import { useEffect } from 'react'
import { newRoomId } from './watchSync'
import { parseYouTubeId } from './youtube'

export function initialWatchId() {
  if (typeof window === 'undefined') return null
  const watch = new URLSearchParams(window.location.search).get('watch')
  if (!watch || watch === 'open') return null
  return parseYouTubeId(watch)
}

export function roomFromWindow() {
  if (typeof window === 'undefined') return newRoomId()
  return new URLSearchParams(window.location.search).get('room') || newRoomId()
}

export function followFromWindow() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('follow') === '1'
}

export function useRoomQuerySync(roomId: string, extra?: Record<string, string>) {
  const extraKey = extra ? JSON.stringify(extra) : ''
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('room')) params.set('room', roomId)
    if (extraKey) {
      const parsed = JSON.parse(extraKey) as Record<string, string>
      for (const [key, value] of Object.entries(parsed)) {
        if (value) params.set(key, value)
      }
    }
    const qs = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }, [roomId, extraKey])
}
