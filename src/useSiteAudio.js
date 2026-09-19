import { useCallback, useEffect, useRef, useState } from 'react'

const BG_SRC = '/bg-audio.mp3'
const REV_SRC = '/carRevv.mp3'
const BG_VOLUME = 0.5 // the bg track is ~7 dB louder than the rev; this evens them out
const BG_DUCKED_VOLUME = 0.2 // bg level while the car revs, low enough to hear the engine
const FADE_MS = 300
const MUTE_KEY = 'anthood-muted'

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

// Nothing plays until start() is called (the click on the garage door). After that the
// background music loops for the whole visit. While the car is hovered the engine rev plays
// (looping, in case the hover outlasts the clip) and the music fades down so the rev can be heard.
export function useSiteAudio() {
  const bg = useRef(null)
  const rev = useRef(null)
  const started = useRef(false)
  const carHovered = useRef(false)
  const fadeFrame = useRef(0)
  const [muted, setMuted] = useState(readMuted)

  const fadeBgTo = useCallback((target) => {
    cancelAnimationFrame(fadeFrame.current)
    const b = bg.current
    if (!b) return
    const from = b.volume
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / FADE_MS)
      b.volume = from + (target - from) * k
      if (k < 1) fadeFrame.current = requestAnimationFrame(step)
    }
    fadeFrame.current = requestAnimationFrame(step)
  }, [])

  // Make playback match the desired state. Safe to call at any time; the returned promise
  // rejects if the browser blocks playback (no user gesture yet).
  const sync = useCallback(() => {
    const b = bg.current
    const r = rev.current
    if (!started.current || !b || !r) return Promise.resolve()
    if (carHovered.current) {
      fadeBgTo(BG_DUCKED_VOLUME)
      return Promise.all([b.play(), r.play()])
    }
    fadeBgTo(BG_VOLUME)
    r.pause()
    r.currentTime = 0
    return b.play()
  }, [fadeBgTo])

  useEffect(() => {
    const b = new Audio(BG_SRC)
    b.loop = true
    b.volume = BG_VOLUME
    const r = new Audio(REV_SRC)
    r.loop = true
    bg.current = b
    rev.current = r
    sync().catch(() => {}) // only does anything if playback had already been started

    return () => {
      cancelAnimationFrame(fadeFrame.current)
      b.pause()
      r.pause()
      bg.current = null
      rev.current = null
    }
  }, [sync])

  useEffect(() => {
    if (bg.current) bg.current.muted = muted
    if (rev.current) rev.current.muted = muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // storage unavailable: the preference just won't persist
    }
  }, [muted])

  // Call from a click/key handler so the browser allows playback.
  const start = useCallback(() => {
    started.current = true
    sync().catch(() => {})
  }, [sync])

  // Fallback if the intro can't run: start on the visitor's first interaction instead.
  const startOnFirstGesture = useCallback(() => {
    const events = ['pointerdown', 'pointerup', 'keydown', 'touchend']
    const unlock = () => {
      started.current = true
      sync().then(disarm, () => {})
    }
    const disarm = () => events.forEach((e) => window.removeEventListener(e, unlock, true))
    events.forEach((e) => window.addEventListener(e, unlock, true))
  }, [sync])

  const setCarHover = useCallback(
    (hovered) => {
      carHovered.current = hovered
      sync().catch(() => {})
    },
    [sync],
  )

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  return { muted, toggleMute, setCarHover, start, startOnFirstGesture }
}
