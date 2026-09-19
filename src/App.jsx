import { useEffect, useRef, useState } from 'react'
import { CAR_HIT, KING_HIT } from './hitAreas'
import Intro from './Intro'
import { STAGE_H, STAGE_W } from './stage'
import { useSiteAudio } from './useSiteAudio'

const WHITELIST_URL = 'https://x.com/KingAnt'

const CAR_STILL = '/antCar-still.png'
const CAR_GIF = '/antCar-transparent.gif'

const GYM = { x: 406, y: 373, w: 420 }
const KING = { x: 32, y: 413, w: 507 }
const CAR = { x: 868, y: 478, w: 612 }

// Each item's x/y/w is in design-canvas pixels (see stage.js), converted to percentages so
// the whole scene scales together.
const place = ({ x, y, w }) => ({
  left: `${(x / STAGE_W) * 100}%`,
  top: `${(y / STAGE_H) * 100}%`,
  width: `${(w / STAGE_W) * 100}%`,
})

// kingAnt-outline.png is the artwork's silhouette grown by OUTLINE_PAD canvas px on every
// side, so it is drawn that much larger than the kingAnt image, centered on it.
const KING_H = 402
const OUTLINE_PAD = 6

const outlineBox = {
  left: `${(-OUTLINE_PAD / KING.w) * 100}%`,
  top: `${(-OUTLINE_PAD / KING_H) * 100}%`,
  width: `${((KING.w + 2 * OUTLINE_PAD) / KING.w) * 100}%`,
  height: `${((KING_H + 2 * OUTLINE_PAD) / KING_H) * 100}%`,
}

function King() {
  return (
    <div className="item king" style={place(KING)}>
      <div className="outline" style={outlineBox} aria-hidden="true" />
      <img src="/kingAnt.svg" alt="" draggable={false} />
      <a
        className="hit"
        href={WHITELIST_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Apply for whitelist here"
        style={{ clipPath: `polygon(${KING_HIT})` }}
      />
    </div>
  )
}

function Car({ onHoverChange }) {
  const [hovered, setHovered] = useState(false)

  const setHover = (value) => {
    setHovered(value)
    onHoverChange(value)
  }

  // Warm the (large) GIF after the page has loaded so the first hover doesn't stall.
  useEffect(() => {
    const preload = () => { new Image().src = CAR_GIF }
    if (document.readyState === 'complete') {
      preload()
      return
    }
    window.addEventListener('load', preload, { once: true })
    return () => window.removeEventListener('load', preload)
  }, [])

  return (
    <div className="item" style={place(CAR)}>
      <img src={hovered ? CAR_GIF : CAR_STILL} alt="Yellow sports car" draggable={false} />
      <div
        className="hit"
        style={{ clipPath: `polygon(${CAR_HIT})` }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
      />
    </div>
  )
}

function MuteButton({ muted, onToggle }) {
  return (
    <button
      type="button"
      className="mute-btn"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        {muted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  )
}

function App() {
  const { muted, toggleMute, setCarHover, start, startOnFirstGesture } = useSiteAudio()
  const sceneRef = useRef(null)
  const [introDone, setIntroDone] = useState(false)

  // If the intro video can't play, skip it and let the first interaction start the music.
  const skipIntro = () => {
    startOnFirstGesture()
    setIntroDone(true)
  }

  return (
    <main className="screen">
      <div className="backdrop" aria-hidden="true" />
      <MuteButton muted={muted} onToggle={toggleMute} />
      <div className="scene" ref={sceneRef} inert={!introDone}>
        <img className="scene-bg" src="/antHoodBG.svg" alt="ANTHOOD garage" draggable={false} />
        <div className="item" style={place(GYM)}>
          <img src="/gymgif-transparent.gif" alt="Doge and two Pepes working out" draggable={false} />
        </div>
        <King />
        <Car onHoverChange={setCarHover} />
      </div>
      {!introDone && (
        <Intro
          sceneRef={sceneRef}
          onStart={start}
          onDone={() => setIntroDone(true)}
          onFail={skipIntro}
        />
      )}
    </main>
  );
}

export default App;
