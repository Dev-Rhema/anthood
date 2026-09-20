import { useRef, useState } from 'react'
import bgSrc from './assets/images/bg.webp'
import Car from './components/Car'
import Gym from './components/Gym'
import Intro from './components/Intro'
import King from './components/King'
import MuteButton from './components/MuteButton'
import { useSiteAudio } from './hooks/useSiteAudio'

export default function App() {
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
        <img className="scene-bg" src={bgSrc} alt="ANTHOOD garage" draggable={false} />
        <Gym />
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
  )
}
