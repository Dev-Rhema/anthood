import gymSrc from '../assets/images/gym.webp'
import { LAYOUT, place } from '../stage'

export default function Gym() {
  return (
    <div className="item" style={place(LAYOUT.gym)}>
      <img src={gymSrc} alt="Doge and two Pepes working out" draggable={false} />
    </div>
  )
}
