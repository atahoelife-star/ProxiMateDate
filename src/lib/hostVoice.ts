let current: HTMLAudioElement | null = null

export function playHostVoice() {
  try {
    current?.pause()
    const audio = new Audio('/audio/host-right-this-way.mp3')
    audio.volume = 0.92
    current = audio
    void audio.play().catch(() => {
      /* Gesture already happened; autoplay should succeed. */
    })
    return audio
  } catch {
    return null
  }
}

export function stopHostVoice() {
  if (!current) return
  current.pause()
  current = null
}
