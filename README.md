# Beyond the Event Horizon — GevannoYoh Portfolio

Cinematic parallax portfolio: a single-scroll descent toward a black hole.
React + TypeScript + Vite + GSAP (ScrollTrigger) + Three.js — black hole,
accretion disk, and starfield are procedural, no image assets needed.
No photos of the owner anywhere — all visuals are abstract and cosmic.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build → dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

Requires Node 20+.

## Customize

All personal content lives in one file: [`src/content.ts`](src/content.ts).
Every placeholder is marked `TODO`. See [`ASSETS.md`](ASSETS.md) for the full
list of things to replace (identity, project thumbnails,
bio, experience, links).

## Structure

```
src/
  components/   Hero About Skills Projects Journey Contact Nav Footer Cosmos
  three/        BlackHoleScene.ts (single WebGL scene) + blackHoleShaders.ts (GLSL)
  hooks/        useGsapScope (StrictMode-safe GSAP) + useReducedMotion
  lib/          gsap.ts (single ScrollTrigger registration)
  styles/       tokens.css (palette/typography) + global.css
  content.ts    all placeholder content + shape contract
```

## Notes

- One fixed fullscreen canvas for the whole page; scroll position drives
  shader recession (warped: fast at first, then slow).
- Animated with GSAP contexts — `ctx.revert()` guarantees cleanup and
  React StrictMode safety.
- `prefers-reduced-motion` → static CSS fallback, no WebGL loop.
- No WebGL → static CSS fallback. Mobile → smaller hole, fewer stars,
  capped pixel ratio.
