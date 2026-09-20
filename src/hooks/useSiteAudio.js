import { useCallback, useEffect, useRef, useState } from 'react'
import revSrc from '../assets/media/car-rev.mp3'
import musicSrc from '../assets/media/music.mp3'

const MUSIC_VOLUME = 0.5 // the music is ~7 dB louder than the rev; this evens them out
const MUSIC_DUCKED_VOLUME = 0.2 // music level while the car revs, low enough to hear the engine
const FADE_MS = 300
const MUTE_KEY = 'anthood-muted'

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

// Nothing plays until start() is called (the click on the garage door). After that the music
// loops for the whole visit. While the car is hovered the engine rev plays (looping, in case
// the hover outlasts the clip) and the music fades down so the rev can be heard.
export function useSiteAudio() {
  const music = useRef(null)
  const rev = useRef(null)
  const started = useRef(false)
  const carHovered = useRef(false)
  const fadeFrame = useRef(0)
  const [muted, setMuted] = useState(readMuted)

  const fadeMusicTo = useCallback((target) => {
    cancelAnimationFrame(fadeFrame.current)
    const m = music.current
    if (!m) return
    const from = m.volume
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / FADE_MS)
      m.volume = from + (target - from) * k
      if (k < 1) fadeFrame.current = requestAnimationFrame(step)
    }
    fadeFrame.current = requestAnimationFrame(step)
  }, [])

  // Make playback match the desired state. Safe to call at any time; the returned promise
  // rejects if the browser blocks playback (no user gesture yet).
  const sync = useCallback(() => {
    const m = music.current
    const r = rev.current
    if (!started.current || !m || !r) return Promise.resolve()
    if (carHovered.current) {
      fadeMusicTo(MUSIC_DUCKED_VOLUME)
      return Promise.all([m.play(), r.play()])
    }
    fadeMusicTo(MUSIC_VOLUME)
    r.pause()
    r.currentTime = 0
    return m.play()
  }, [fadeMusicTo])

  useEffect(() => {
    const create = (src, volume) => {
      const audio = new Audio()
      audio.preload = 'none' // don't compete with the intro for bandwidth
      audio.src = src
      audio.loop = true
      audio.volume = volume
      return audio
    }
    const m = create(musicSrc, MUSIC_VOLUME)
    const r = create(revSrc, 1)
    music.current = m
    rev.current = r

    // Once the page has loaded, fetch both tracks with ordinary requests (which browsers cache
    // permanently, unlike media-element requests) and play from the local copy. If that fails,
    // or the visitor clicks first, the tracks simply stream from the network as normal.
    let cancelled = false
    const objectUrls = []
    const prefetch = async (audio, src) => {
      try {
        const response = await fetch(src)
        if (!response.ok) return
        const url = URL.createObjectURL(await response.blob())
        if (cancelled || started.current) return URL.revokeObjectURL(url)
        objectUrls.push(url)
        audio.src = url
      } catch {
        // keep the network source
      }
    }
    const warm = async () => {
      await Promise.all([prefetch(m, musicSrc), prefetch(r, revSrc)])
      if (cancelled || started.current) return
      m.preload = r.preload = 'auto'
      m.load()
      r.load()
    }
    if (document.readyState === 'complete') warm()
    else window.addEventListener('load', warm, { once: true })

    sync().catch(() => {}) // only does anything if playback had already been started

    return () => {
      cancelled = true
      window.removeEventListener('load', warm)
      cancelAnimationFrame(fadeFrame.current)
      m.pause()
      r.pause()
      music.current = null
      rev.current = null
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [sync])

  useEffect(() => {
    if (music.current) music.current.muted = muted
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
