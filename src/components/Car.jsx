import { useEffect, useState } from 'react'
import carAnimated from '../assets/images/car.webp'
import carStill from '../assets/images/car-still.webp'
import { CAR_HIT } from '../hitAreas'
import { LAYOUT, place } from '../stage'

// Static until hovered; hovering swaps in the animation (which restarts from the still's pose).
export default function Car({ onHoverChange }) {
  const [hovered, setHovered] = useState(false)

  const setHover = (value) => {
    setHovered(value)
    onHoverChange(value)
  }

  // Fetch the (larger) animation once the page has loaded so the first hover doesn't stall.
  useEffect(() => {
    const preload = () => {
      new Image().src = carAnimated
    }
    if (document.readyState === 'complete') {
      preload()
      return
    }
    window.addEventListener('load', preload, { once: true })
    return () => window.removeEventListener('load', preload)
  }, [])

  return (
    <div className="item" style={place(LAYOUT.car)}>
      <img src={hovered ? carAnimated : carStill} alt="Yellow sports car" draggable={false} />
      <div
        className="hit"
        style={{ clipPath: `polygon(${CAR_HIT})` }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
      />
    </div>
  )
}
