# ANTHOOD

The ANTHOOD landing page: a garage-door intro that opens onto an illustrated garage scene.

- Click the garage door to start. The door rolls up, the camera pushes through the doorway, and the full scene appears.
- Hover the **car** to hear it rev (the music ducks underneath) and see it animate.
- Hover the **desk** for the outline; click it to apply for the whitelist.
- The yellow button (top right) mutes all sound.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm run lint
```

Built with React 19 + Vite. Deployed on Vercel (`vercel.json` pins the Vite settings and gives the hashed files in `/assets` a permanent cache).

## How it's put together

```
src/
  App.jsx              composes the scene, the intro and the mute button
  stage.js             the 1512x982 design canvas and where each piece of art sits on it
  hitAreas.js          silhouette outlines used as clickable/hoverable areas
  components/          Intro, King (desk + link), Car, Gym, MuteButton (+ their CSS)
  hooks/useSiteAudio.js  music, car rev and mute logic
  assets/              everything the app imports: images, media, cursors
public/                favicon and apple-touch icon only
source-assets/         (not in git) original artwork and source files
```

**Layout.** Everything is positioned on a fixed 1512x982 canvas in percentages, so the scene scales as one piece. On screens 768px and wider it fills the viewport, cropping ceiling and floor rather than the desk, gym and car; on other shapes a blurred copy of the background fills the gaps.

**Intro.** `components/Intro.jsx` plays `garagedoor.mp4` (permanently muted). The video's last frame is aligned to the page (`VIDEO_TO_DESIGN` and `OPENING` at the top of the file), so the transition into the page has no visible seam. If you replace the video, re-measure those two values.

**Audio.** Browsers block sound until the visitor interacts, so the click on the garage door is what starts the music. Nothing plays before it.

## Assets

Images are WebP (the two SVG-wrapped PNGs went from about 15 MB to under 0.4 MB); the two animations are animated WebP. Files imported from `src/assets` get content-hashed names, so browsers cache them permanently and re-download only what changes.

`source-assets/originals` holds the source files (kept locally and gitignored, because they're large). Keep a backup of it: `npm run build` only clears `dist/`, but nothing else has these originals.
