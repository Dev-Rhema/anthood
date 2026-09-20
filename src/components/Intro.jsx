import { useEffect, useRef, useState } from 'react'
import posterSrc from '../assets/media/garagedoor-poster.webp'
import videoSrc from '../assets/media/garagedoor.mp4'
import { STAGE_W } from '../stage'
import './Intro.css'

const VIDEO_W = 1280
// Where the video's frame lands on the page's design canvas, measured by matching the video's
// last frame to the design: design px = VIDEO_TO_DESIGN.s * video px + (x, y).
const VIDEO_TO_DESIGN = { s: 0.9153, x: 221.0, y: 285.9 }
// The doorway opening in the video's last frame, in video px.
const OPENING = { x0: 292, y0: 152, x1: 990, y1: 655 }

const PHASE_MS = 1100
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Full-screen garage door video shown before the page. A click on it starts the audio and the
// video; when the door is fully up the camera pushes through the doorway while the page (kept
// exactly aligned with the doorway view) takes over, then eases back out to the full page.
export default function Intro({ sceneRef, onStart, onDone, onFail }) {
  const [started, setStarted] = useState(false)
  const startedRef = useRef(false)
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const animations = useRef([])

  // Cancel anything still running if the intro is removed early.
  useEffect(() => {
    const running = animations.current
    const scene = sceneRef.current
    return () => {
      running.forEach((a) => a.cancel())
      if (scene) scene.style.transformOrigin = ''
    }
  }, [sceneRef])

  const begin = () => {
    if (startedRef.current) return
    startedRef.current = true
    setStarted(true)
    onStart()
    videoRef.current.play().catch(onFail)
  }

  const play = (target, keyframes, options) => {
    const anim = target.animate(keyframes, options)
    animations.current.push(anim)
    return anim
  }

  const transition = async () => {
    const scene = sceneRef.current
    const stage = stageRef.current
    const video = videoRef.current
    if (!scene) return onDone()

    // Don't reveal a half-loaded page.
    const bgImage = scene.querySelector('.scene-bg')
    if (bgImage) await bgImage.decode().catch(() => {})

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fade = play(rootRef.current, { opacity: [1, 0] }, { duration: 500, fill: 'forwards' })
      await fade.finished.catch(() => {})
      return onDone()
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    const vr = video.getBoundingClientRect()
    const vs = vr.width / VIDEO_W // screen px per video px
    const sr = scene.getBoundingClientRect() // page at rest, no transform
    const ss = sr.width / STAGE_W // screen px per design px
    const { s: a, x: bx, y: by } = VIDEO_TO_DESIGN

    // Doorway centre on screen, and the zoom that makes the doorway fill the screen.
    const ox = vr.left + ((OPENING.x0 + OPENING.x1) / 2) * vs
    const oy = vr.top + ((OPENING.y0 + OPENING.y1) / 2) * vs
    const zoom = clamp(
      Math.max(vw / ((OPENING.x1 - OPENING.x0) * vs), vh / ((OPENING.y1 - OPENING.y0) * vs)),
      1.4,
      2.6,
    )

    // Page transform (origin top-left) that makes it line up with the video frame...
    const k = vs / a / ss
    const tx = vr.left - (bx / a) * vs - sr.left
    const ty = vr.top - (by / a) * vs - sr.top
    // ...and the same thing after zooming about the doorway centre.
    const tx2 = ox + zoom * (sr.left + tx - ox) - sr.left
    const ty2 = oy + zoom * (sr.top + ty - oy) - sr.top

    scene.style.transformOrigin = '0 0'
    stage.style.transformOrigin = `${ox}px ${oy}px`

    const sceneAnim = play(
      scene,
      [
        { transform: `translate(${tx}px, ${ty}px) scale(${k})`, easing: EASE },
        { transform: `translate(${tx2}px, ${ty2}px) scale(${k * zoom})`, offset: 0.5, easing: EASE },
        { transform: 'translate(0px, 0px) scale(1)' },
      ],
      { duration: PHASE_MS * 2, fill: 'both' },
    )
    // Video zooms in lockstep with the page, then dissolves away over the second half.
    play(stage, [{ transform: 'scale(1)' }, { transform: `scale(${zoom})` }], {
      duration: PHASE_MS,
      easing: EASE,
      fill: 'forwards',
    })
    play(stage, { opacity: [1, 0] }, {
      duration: PHASE_MS * 0.65,
      delay: PHASE_MS * 0.35,
      easing: 'ease-in-out',
      fill: 'both',
    })

    await sceneAnim.finished.catch(() => {})
    onDone()
  }

  // The video is permanently silent, whatever the site's mute button says.
  const silence = (el) => {
    if (!el) return
    el.muted = true
    el.defaultMuted = true
  }

  return (
    <div ref={rootRef} className="intro" data-started={started || undefined} onClick={begin}>
      <div ref={stageRef} className="intro-stage">
        <video
          ref={(el) => {
            videoRef.current = el
            silence(el)
          }}
          className="intro-video"
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          preload="auto"
          onVolumeChange={(e) => silence(e.currentTarget)}
          onEnded={() => transition().catch(onDone)}
          onError={onFail}
        />
      </div>
      <button type="button" className="intro-poster" aria-label="Click here to open the garage door">
        Click here
      </button>
    </div>
  )
}
