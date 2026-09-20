import kingSrc from '../assets/images/king.webp'
import { KING_HIT } from '../hitAreas'
import { LAYOUT, place } from '../stage'
import './King.css'

const WHITELIST_URL = 'https://x.com/KingAnt'

// king-outline.png is the artwork's silhouette grown by OUTLINE_PAD canvas px on every side,
// so it is drawn that much larger than the artwork, centered on it.
const OUTLINE_PAD = 6
const { w, h } = LAYOUT.king
const outlineBox = {
  left: `${(-OUTLINE_PAD / w) * 100}%`,
  top: `${(-OUTLINE_PAD / h) * 100}%`,
  width: `${((w + 2 * OUTLINE_PAD) / w) * 100}%`,
  height: `${((h + 2 * OUTLINE_PAD) / h) * 100}%`,
}

// The desk with the ant, and the "apply for whitelist" link. The link's clickable area follows
// the artwork's silhouette rather than its rectangle.
export default function King() {
  return (
    <div className="item king" style={place(LAYOUT.king)}>
      <div className="outline" style={outlineBox} aria-hidden="true" />
      <img src={kingSrc} alt="" draggable={false} />
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
