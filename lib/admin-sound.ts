const MUTE_KEY = 'sky-smoke-admin-sound-muted'
const MUTE_EVENT = 'sky-smoke-sound-mute-changed'

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(MUTE_KEY) === '1'
}

export function setSoundMuted(muted: boolean) {
  window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  window.dispatchEvent(new CustomEvent(MUTE_EVENT, { detail: muted }))
}

export function onSoundMuteChange(handler: (muted: boolean) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail)
  window.addEventListener(MUTE_EVENT, listener)
  return () => window.removeEventListener(MUTE_EVENT, listener)
}

/** Short two-note chime via Web Audio — no audio asset needed. */
export function playChime() {
  if (typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return

  const ctx = new AudioContextClass()
  const notes = [880, 1174.66]

  notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * 0.12
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.3)
  })

  setTimeout(() => ctx.close(), 700)
}
