let current: HTMLAudioElement | null = null
let wantPlay = false
let unlocking = false

/**
 * Unlock host audio on the thumbnail tap so “Right this way” can play
 * after the doors part (the play() call is on a timer, outside the click).
 */
export function primeHostVoice() {
  try {
    wantPlay = false
    unlocking = true
    current?.pause()
    const audio = new Audio('/audio/host-right-this-way.mp3')
    audio.volume = 0.92
    audio.preload = 'auto'
    current = audio
    audio.muted = true
    void audio
      .play()
      .then(() => {
        unlocking = false
        if (wantPlay && current === audio) {
          audio.muted = false
          audio.currentTime = 0
          return audio.play()
        }
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      })
      .catch(() => {
        unlocking = false
        audio.muted = false
      })
    return audio
  } catch {
    unlocking = false
    return null
  }
}

export function playHostVoice() {
  try {
    wantPlay = true
    const audio = current ?? new Audio('/audio/host-right-this-way.mp3')
    audio.volume = 0.92
    current = audio
    if (unlocking) return audio
    audio.muted = false
    void audio.play().catch(() => {
      /* Primed on the thumbnail tap; autoplay should succeed. */
    })
    return audio
  } catch {
    return null
  }
}

export function stopHostVoice() {
  wantPlay = false
  unlocking = false
  if (!current) return
  current.pause()
  current.currentTime = 0
  current = null
}
