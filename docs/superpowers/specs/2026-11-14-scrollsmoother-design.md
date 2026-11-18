# Design: Migrasi Lenis → ScrollSmoother (Smooth Wrapper)

Tanggal: 2026-11-14
Pendekatan terpilih: B — ScrollSmoother penuh gantikan Lenis

## 1. Intent & Why

Pengguna ingin mencoba efek parallax dan feel scroll berbeda dari Lenis,
dengan struktur semirip Moncy (Smooth Wrapper `#smooth-wrapper` /
`#smooth-content` + `ScrollSmoother.create`). Tujuan: feel peredam ala
Moncy (`smooth: 1.7`) + parallax bawaan (`effects: true`, `data-speed` /
`data-lag`) sebagai fondasi efek scroll berikutnya.

## 2. Goals / Non-goals / Anti-goals

Goals:
- Satu mesin scroll: ScrollSmoother resmi dari `gsap` inti 3.15
  (`gsap/ScrollSmoother.js`, sudah ada di node_modules — gratis sejak 3.13,
  tanpa `gsap-trial`).
- Markup wrapper seperti Moncy: `#smooth-wrapper` > `#smooth-content`
  membungkus konten scroll (main + footer).
- Semua navigasi imperatif (`scrollTo` anchor, kuantizer hero 1-stop,
  tombol kembali ke atas) jalan via `smoother.scrollTo`.
- Pin hero + fade blackhole + reveal about tetap bekerja di atas Smoother.
- Reduced-motion: Smoother mati total, scroll native.
- Parallax dasar aktif: `effects: true` + minimal 1 atribut `data-speed`
  di hero sebagai bukti efek jalan.

Non-goals:
- Tidak menyalin CSS/aset/desain Moncy. Hanya mekanisme scroll.
- Tidak mengubah copy hero (4 baris tetap) dan identitas visual situs.
- Tidak mengaktifkan `SplitText`/plugin trial lain.

Anti-goals (gagal walau teknis jalan):
- Lenis dan Smoother hidup bersamaan (berebut kontrol scroll).
- Kuantizer 1-stop rusak (1 notch tidak mendarat S=200).
- Pin hero + overlap about patah (about melompat / hit-test mati).
- Scroll anchor/nav dan tombol OrbitProgress mati.

## 3. Constraints

- `gsap@3.15.0` sudah terpasang; `ScrollSmoother.js` + `ScrollTrigger.js`
  ada di `node_modules/gsap`. DILARANG install `gsap-trial`.
- Folder proyek bukan git: tanpa commit; rollback manual per file.
- WebGL (blackhole) membaca `window.scrollY` — dengan Smoother, scroll
  aktual tetap window scroll (Smoother menggeser content via transform
  tapi memakai native scroll position sebagai driver), jadi pembacaan
  tetap valid. Perlu verifikasi terukur.
- Mobile (≤900px): hero tanpa pin/kuantizer. Smoother memakai
  `ignoreMobileResize: true` seperti Moncy; bila bermasalah, fallback:
  Smoother hanya desktop, mobile native.
- Bahasa: Indonesia, to the point. Tanpa karakter/humanoid/foto/wajah.

## 4. Approaches (dipertimbangkan)

A. Lenis tetap + parallax manual (~30 baris util data-speed).
   Ditolak peminta: ingin feel + struktur Smoother, bukan simulasi.
B. ScrollSmoother penuh gantikan Lenis. DIPILIH.
   Pro: struktur identik Moncy, feel + parallax bawaan.
   Kontra: migrasi menyentuh 5+ file, risiko pin/kuantizer/WebGL.
C. Keduanya hidup bersamaan. Ditolak: konflik kontrol scroll klasik.

## 5. Keputusan peminta (fixed)

- B, Lenis boleh dihapus total.
- Tujuan: parallax + feel berbeda.
- (2026-11-14, pasca builder-check) Kuantizer 1-stop DILEPAS — Hero
  disederhanakan ke scroll mengalir seperti Moncy (hapus wheel hijack).
- Bila pin + overlap about patah di dalam content transform, builder
  BOLEH membetulkan angka (margin overlap, pinSpacing, threshold
  about-live) — tanpa rollback ke Lenis.
- Smoother di mobile (≤900px) MATI TOTAL, scroll native.

## 6. Desain implementasi (untuk builder)

6.1. Modul baru `src/hooks/useScrollSmoother.ts` (pengganti `useLenis.ts`):
- `useEffect`: bila `!enabled` return; bila `window.innerWidth <= 900`
  dan diputuskan mobile-native, return.
- `gsap.registerPlugin(ScrollTrigger, ScrollSmoother)` (impor dari
  `../lib/gsap` yang ditambah ekspor ScrollSmoother).
- `smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper',
  content: '#smooth-content', smooth: 1.7, effects: true,
  smoothTouch: 0.1?, normalizeScroll: false, ignoreMobileResize: true })`.
  Nilai awal meniru Moncy; tuning setelah probe.
- Simpan `window.__smoother = smoother`; cleanup `smoother.kill()` +
  `window.__smoother = undefined`.
- Sinkronisasi ScrollTrigger otomatis oleh Smoother (tanpa
  `lenis.on('scroll', update)`); pastikan `ScrollTrigger.refresh()`
  setelah create + setelah font/layout settle.

6.2. `src/App.tsx`:
- Bungkus `<main>` + `<Footer/>` dalam
  `<div id="smooth-wrapper"><div id="smooth-content">…</div></div>`.
- Tetap di luar: `<Cosmos/>` (canvas fixed global), `<CursorGlow/>`,
  `<OrbitProgress/>`, `<Nav/>` (fixed), `<WormholeTransition/>` overlay.
- Ganti `useLenis(!reduced)` → `useScrollSmoother(!reduced)`.
- Anchor `finish()`: `__smoother.scrollTo(el)` bila ada, else
  `scrollIntoView`.

6.3. Hapus Lenis:
- Hapus `src/hooks/useLenis.ts`, dependensi `lenis` dari package.json
  (atau biarkan tak terpakai? PUTUSKAN: hapus dari package.json +
  `npm uninstall lenis` agar tak ada kode mati).
- Hapus CSS `.lenis*` di `src/styles/global.css`; tambah aturan
  Smoother bila perlu (`#smooth-wrapper{overflow:hidden}` diatur
  otomatis oleh plugin — jangan duplikasi kecuali terbukti perlu).
- Ganti semua `window.__lenis` → `window.__smoother`:
  `Hero.tsx` (kuantizer), `JourneyFlightPath.tsx`, `OrbitProgress.tsx`.

6.4. `src/lib/gsap.ts`: tambah
  `import { ScrollSmoother } from 'gsap/ScrollSmoother'`,
  register, ekspor.

6.5. Kuantizer hero (`Hero.tsx`):
- Ganti `lenis.scrollTo(next, {duration:0.75})` →
  `smoother.scrollTo(next)` (API Smoother: `scrollTo(target, smooth?, position?)`).
- Flag `lenisStopPropagation` TIDAK berlaku untuk Smoother.
  Ganti dengan `e.stopPropagation()` + `e.preventDefault()` saja, lalu
  VERIFIKASI apakah Smoother membuat scroll saingan (seperti kasus
  Lenis `t:120`). Bila ya, cari guard resmi Smoother
  (`smoother.paused(true)` sesaat atau `ScrollTrigger` lock) — JANGAN
  mengarang flag.
- Target stop tetap `[0, MASTER_PX]` (1-stop, sudah PASS).

6.6. Pin + timeline hero:
- `pin: true, pinSpacing: false` di dalam Smoother memakai pinType
  `transform` otomatis. Verifikasi: about overlap
  (`margin-top: calc(-100svh + 200px)`) + counter `y:-200→0` tetap
  sejajar; `about-live` toggle di progress 0.75 tetap.
- `scrub: 0.6`, tween teks `yPercent:40` + `opacity:0`, `power1.out`
  dipertahankan apa adanya.

6.7. Parallax bukti-jalan:
- Tambah `data-speed="0.85"` pada satu elemen hero non-teks
  (mis. `.hero-scroll` atau ornamen) + `data-lag` bila perlu.
  Efek: elemen bergerak lebih lambat dari scroll = parallax Moncy.
  Teks utama JANGAN diberi data-speed (ikut timeline exit, bukan efek).

6.8. Verifikasi wajib (seperti probe sebelumnya):
- tsc 0, oxlint 0, build lulus.
- Probe 1-stop: 1 notch → S=200, teks 0, about live.
- Probe smoothness: sampling settle tanpa judder.
- Probe anchor: klik nav → mendarat section benar.
- Probe RM + mobile 390px: tanpa Smoother, tanpa error.

## 7. Diserahkan ke builder

- Nilai `smooth`/`smoothTouch` final (tuning feel).
- Hapus vs biarkan dependensi `lenis` di package.json.
- Smoother di mobile: aktif dengan ignoreMobileResize vs mati total.
- Elemen mana yang dapat `data-speed` pertama (selain contoh di 6.7).
