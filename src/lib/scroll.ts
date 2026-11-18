/* Konstanta scroll bersama — SATU sumber kebenaran untuk jendela master
   hero→about (sinkron manual antar 4 konsumen):
   - Hero.tsx: MASTER_PX (pin end, counter about, timeline)
   - useScrollSmoother.ts: scrollTo(#about) = ujung master
   - About.css: margin-top calc(-100svh + Npx) — CSS, salin angka manual
   - BlackHoleScene.ts: HERO_FADE_PX (denominator fade)
   Ubah di sini → ubah keempatnya (CSS tak bisa impor TS). */
export const HERO_MASTER_PX = 200;
