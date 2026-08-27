export const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed

  const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(normalized)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]?.split('?')[0]
      return id && YOUTUBE_ID_RE.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v')
      if (v && YOUTUBE_ID_RE.test(v)) return v

      const parts = url.pathname.split('/').filter(Boolean)
      for (const key of ['embed', 'shorts', 'live', 'v']) {
        const idx = parts.indexOf(key)
        if (idx >= 0 && parts[idx + 1] && YOUTUBE_ID_RE.test(parts[idx + 1])) return parts[idx + 1]
      }
    }
  } catch {
    return null
  }
  return null
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

export type YTPlayerHandle = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
  loadVideoById: (id: string) => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayerHandle
      PlayerState: {
        UNSTARTED: number
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
    if (window.YT?.Player) resolve()
  })
  return apiPromise
}

export function embedErrorMessage(code: number): string {
  if (code === 101 || code === 150) {
    return 'This YouTube video does not allow embedding. Paste another link — trailers that allow embed work; many full movies do not.'
  }
  if (code === 100) return 'YouTube could not find that video. Check the link and try another.'
  if (code === 2) return 'That YouTube link looks invalid. Use youtube.com or youtu.be.'
  return 'YouTube could not play this video in the page. Try another embeddable link.'
}

export const ROMANTIC_TRAILERS = [
  { label: 'La La Land', id: '0pdqf4P9MB8', mood: 'Dreamy & Musical' },
  { label: 'The Notebook', id: 'yDJIcYE32NU', mood: 'Emotional Romance' },
  { label: 'Pride & Prejudice', id: 'Ur_DIHsARJ4', mood: 'Elegant & Tender' },
  { label: 'Before Sunrise', id: '9vN6DHB6bJc', mood: 'Intimate Conversation' },
]
