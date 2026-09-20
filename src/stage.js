// The scene is laid out on this design canvas (the size of the reference mockup).
export const STAGE_W = 1512
export const STAGE_H = 982

// Where each piece of artwork sits on the canvas, in canvas pixels.
export const LAYOUT = {
  gym: { x: 406, y: 373, w: 420 },
  king: { x: 32, y: 413, w: 507, h: 402 },
  car: { x: 868, y: 478, w: 612 },
}

// Converts canvas pixels to percentages so the whole scene scales together.
export const place = ({ x, y, w }) => ({
  left: `${(x / STAGE_W) * 100}%`,
  top: `${(y / STAGE_H) * 100}%`,
  width: `${(w / STAGE_W) * 100}%`,
})
