import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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

export function useRoomClock() {
  const [roomTime, setRoomTime] = useState('00:00')
  useEffect(() => {
    const startTime = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setRoomTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])
  return roomTime
}

export function useRoomQuerySync(roomId: string) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === '1') {
      toast.success('Stripe Checkout completed', {
        description: 'Thank you. This room stays open either way — nothing extra was unlocked.',
      })
      params.delete('paid')
    }
    if (!params.get('room')) params.set('room', roomId)
    const qs = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }, [roomId])
}
