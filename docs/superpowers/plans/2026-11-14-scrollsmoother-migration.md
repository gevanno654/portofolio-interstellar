# ScrollSmoother Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti mesin scroll Lenis dengan ScrollSmoother (Smooth Wrapper ala Moncy) + hapus kuantizer hero.

**Architecture:** Hook baru `useScrollSmoother` membuat `ScrollSmoother` dari `gsap` inti 3.15; `App.tsx` membungkus konten dalam `#smooth-wrapper`/`#smooth-content`; semua `window.__lenis` dialihkan ke `window.__smoother`; kuantizer wheel Hero dihapus total.

**Tech Stack:** React 19, GSAP 3.15 (ScrollTrigger + ScrollSmoother inti, TANPA gsap-trial), TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-14-scrollsmoother-design.md`

## Global Constraints

- DILARANG install `gsap-trial` — ScrollSmoother diimpor dari `gsap/ScrollSmoother` (gratis sejak 3.13, sudah di node_modules).
- Tanpa karakter/humanoid/foto/wajah; copy hero 4 baris tetap.
- Hapus Lenis total: `useLenis.ts` dihapus, `lenis` di-uninstall dari package.json, CSS `.lenis*` dihapus, tidak ada `window.__lenis` tersisa.
- Mobile ≤900px + reduced-motion: Smoother MATI, scroll native.
- Kuantizer DILEPAS: tidak ada wheel hijack, tidak ada stop buatan.
- Folder bukan git: tanpa commit; rollback manual per file (abaikan langkah "Commit" — ganti dengan checkpoint baca-ulang file).
- Bahasa komentar kode: Indonesia, to the point.

## Review Focus

- Pin hero `pinType: transform` di dalam `#smooth-content`: about overlap harus tetap sejajar, `about-live` aktif di progress > 0.75.
- ScrollTrigger di Cosmos/Journey/Orbit/Skills tanpa `scroller:` eksplisit harus ikut scroller Smoother otomatis.
- `smoother.scrollTo(el, true, "top top+=OFFSET")`: format posisi wajib probe (bukan `offset` Lenis).
- Fade blackhole membaca `window.scrollY`: Smoother memakai native scroll sebagai driver — nilai tetap bergerak, tapi ada lag visual vs posisi mentah.
- Reduced-motion + mobile 390px: tidak ada error, tidak ada Smoother aktif.

---

### Task 1: Registrasi ScrollSmoother di lib/gsap

**Files:**
- Modify: `src/lib/gsap.ts`

**Interfaces:**
- Consumes: `gsap/ScrollSmoother` (sudah di node_modules, `gsap@3.15.0`).
- Produces: ekspor bernama `ScrollSmoother` dari `../lib/gsap` untuk dipakai hook Task 2.

- [x] **Step 1: Tulis tipe global sementara untuk verifikasi impor**

Run: `node -e "import('gsap/ScrollSmoother').then(m=>console.log('import-ok',typeof m.ScrollSmoother))"` dengan `--input-type=module` dari `D:\CodeProject\Portofolio`
Expected: `import-ok function`
Hasil 2026-11-14: `import-ok function` via `m.default` (modul root hanya default-export; named-import gagal di bundle Vite dev — rangkul default-export + self-register manual).

- [x] **Step 2: Tambahkan ScrollSmoother ke `src/lib/gsap.ts`**

Ubah file menjadi: impor `gsap`, `ScrollTrigger` (tetap), tambah `import { ScrollSmoother } from "gsap/ScrollSmoother"`, `gsap.registerPlugin(ScrollTrigger, ScrollSmoother)`, ekspor ketiganya.
Hasil 2026-11-14: DONE via `import ScrollSmootherDefault from "gsap/ScrollSmoother"` + cast tipe `create()` (kelas asli tanpa tipe `create` statis). Registrasi + ekspor bernama jalan.

- [x] **Step 3: Verifikasi tsc + build lulus**

Run: `npx tsc --noEmit` dari `D:\CodeProject\Portofolio`
Expected: exit 0, tanpa error.
Hasil 2026-11-14: exit 0.

---

### Task 2: Hook useScrollSmoother + hapus Lenis

**Files:**
- Create: `src/hooks/useScrollSmoother.ts`
- Delete: `src/hooks/useLenis.ts`
- Modify: `src/styles/global.css` (hapus blok `.lenis*` baris 20-32)
- Modify: `package.json` (hapus baris dependensi `lenis`)

**Interfaces:**
- Consumes: `gsap, ScrollTrigger, ScrollSmoother` dari `../lib/gsap` (Task 1).
- Produces: `window.__smoother: ScrollSmoother | undefined` (declare global di hook); hook `useScrollSmoother(enabled: boolean): void`. Nilai create Moncy: `smooth: 1.7, effects: true, ignoreMobileResize: true, smoothTouch: 0.1`.

- [x] **Step 1: Tulis `src/hooks/useScrollSmoother.ts`**

Isi (meniru pola `useLenis.ts`): `useEffect` — bila `!enabled` atau `window.innerWidth <= 900` return; `ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.7, effects: true, smoothTouch: 0.1, ignoreMobileResize: true })`; simpan `window.__smoother`; `ScrollTrigger.refresh()` setelah create; cleanup `smoother.kill()` + `undefined`. Anchor `#…` dicegat → `smoother.scrollTo(target, true, "top top-=64px")` (offset nav 64px, format posisi ScrollTrigger — TBC probe Task 5; tulis dulu, betulkan bila probe gagal).
Hasil 2026-11-14: DONE + kasus khusus `#about → scrollTo(200)` (overlap docTop=0); anchor lain `"top top+=64px"`.

- [x] **Step 2: Hapus `src/hooks/useLenis.ts`, blok `.lenis*` di global.css, dependensi `lenis` di package.json**

Hapus file via `Remove-Item`; hapus baris 20-32 global.css (komentar + 3 aturan); hapus baris `"lenis": …` dari package.json lalu run `npm uninstall lenis`.
Hasil 2026-11-14: DONE — `useLenis.ts` tidak ada; satu-satunya kata "lenis" tersisa hanya komentar dokumentasi di hook baru.

- [x] **Step 3: Verifikasi tidak ada referensi lenis tersisa + tsc lulus**

Run: `grep -rn "lenis" src package.json` (gunakan `Select-String` PowerShell bila grep tak ada) — Expected: nol hasil. Lalu `npx tsc --noEmit` — Expected: exit 0.
Hasil 2026-11-14: nol hasil kode (hanya 1 komentar); tsc exit 0.

---

### Task 3: Wrapper + alihkan App/Journey/Orbit ke smoother

**Files:**
- Modify: `src/App.tsx` (baris 15, 31, 70-71, 83-91)
- Modify: `src/components/JourneyFlightPath.tsx` (baris 78-79)
- Modify: `src/components/OrbitProgress.tsx` (baris 71-72)

**Interfaces:**
- Consumes: `useScrollSmoother` (Task 2), `window.__smoother.scrollTo`.
- Produces: markup `#smooth-wrapper > #smooth-content` membungkus `<main>` + `<Footer/>`; Cosmos/Nav/overlay tetap di luar.

- [x] **Step 1: Bungkus konten di `App.tsx` + ganti hook dan anchor**

`import { useLenis }` → `import { useScrollSmoother }`; `useLenis(!reduced)` → `useScrollSmoother(!reduced)`; `window.__lenis` + `lenis.scrollTo(el,{offset:-64})` → `__smoother` + `smoother.scrollTo(el, true, "top top-=64px")`; bungkus `<main>…</main><Footer/>` dalam `<div id="smooth-wrapper"><div id="smooth-content">`.
Hasil 2026-11-14: DONE — fixed layer (Cosmos/Nav/glow/orbit/wormhole) di LUAR wrapper; hanya konten scroll di dalam.

- [x] **Step 2: Alihkan `JourneyFlightPath.tsx` dan `OrbitProgress.tsx`**

Pola sama: `__lenis` → `__smoother`; `scrollTo(el,{offset:-64})` → `scrollTo(el, true, "top top-=64px")`; `scrollTo(0)` → `smoother.scrollTo(0, true)` (fallback `scrollIntoView`/`scrollTo` native tetap).
Hasil 2026-11-14: DONE — Journey pakai `"top top+=64px"`, Orbit pakai `scrollTo(0, true)`.

- [x] **Step 3: Verifikasi tsc + build**

Run: `npx tsc --noEmit; npm run build` — Expected: keduanya lulus.
Hasil 2026-11-14: keduanya lulus.

---

### Task 4: Sederhanakan Hero — hapus kuantizer, data-speed, pin tetap

**Files:**
- Modify: `src/components/Hero.tsx` (hapus `useEffect` kuantizer baris 30-131 + impor `useEffect` bila tak terpakai; pin/timeline dipertahankan)
- Modify: `src/components/Hero.css` bila perlu (tanpa ubah visual)

**Interfaces:**
- Consumes: `window.__smoother` TIDAK dipakai di Hero (tidak ada scrollTo imperatif tersisa di Hero setelah kuantizer dihapus).
- Produces: Hero tanpa wheel hijack; master timeline pin + scrub + `about-live` tidak berubah; `data-speed="0.85"` pada `.hero-scroll` sebagai bukti parallax.

- [x] **Step 1: Hapus seluruh `useEffect` kuantizer (baris 30-131) + komentar MASTER_PX disesuaikan**

Hapus blok `useEffect` + `killLenisWheel` + `go` + `onWheel` + listener. Perbarui komentar baris 22-25: kuantizer dilepas, scroll mengalir seperti Moncy. Pastikan `useEffect` import masih dipakai (intro timeline pakai `useGsapScope`, bukan `useEffect` — bila tidak ada `useEffect` tersisa, hapus impornya).
Hasil 2026-11-14: DONE — kuantizer + wheel hijack hilang total; pin/scrub/about-live tetap.

- [x] **Step 2: Tambah `data-speed="0.85"` pada `.hero-scroll` di JSX Hero**

Bukti parallax jalan; teks utama (`.hero-content`) JANGAN diberi efek (ikut timeline exit).
Hasil 2026-11-14: DONE — probe: parallax translate aktif di `.hero-scroll`.

- [x] **Step 3: Verifikasi tsc + oxlint + build**

Run: `npx tsc --noEmit; npx oxlint src; npm run build` — Expected: semua lulus.
Hasil 2026-11-14: semua lulus (tsc 0, oxlint 0, build ✓).

---

### Task 5: Probe visual + fiksasi pin/overlap bila patah

**Files:**
- Modify bila perlu: `src/components/About.css` (margin overlap), `src/components/Hero.tsx` (threshold `about-live`, `pinSpacing`), `src/hooks/useScrollSmoother.ts` (nilai `smooth`/`smoothTouch`).

**Interfaces:**
- Consumes: dev server `npm run dev -- --port 5173 --host 127.0.0.1` + puppeteer-core (pola probe sebelumnya di `vprobe.cjs` sementara, hapus setelah selesai).

- [x] **Step 1: Nyalakan dev server + probe scroll mengalir**

Satu wheel `deltaY=120` tanpa kuantizer: scrollY bergerak mengalir (bukan lompat stop), teks fade + gerak +40% jalan, about muncul di ujung. Catat nilai aktual.
Hasil PASS 2026-11-14: W200→y=200 heroOp=0 about-live+reveal=1; wheel CDP naik/turun normal; data-speed 0.85 parallax translate aktif.

- [x] **Step 2: Probe pin/overlap — about sejajar + `about-live` aktif**

Di S=akhir: about mengisi viewport tepat (tanpa lompat/gap), `about-live` true. Bila patah: betulkan angka (margin `calc(-100svh + Npx)`, `pinSpacing`, threshold 0.75) — DIIZINKAN user. Ulangi probe sampai PASS.
Hasil PASS 2026-11-14: angka overlap/counter/threshold TETAP — tidak perlu dibetulkan. Perbaikan yang dilakukan: Cosmos `onUpdate` baca `self.progress` (bukan `window.scrollY` mentah — fase/judder vs Smoother).

- [x] **Step 3: Probe anchor + mobile/RM + gate akhir**

Klik nav → mendarat section benar (betulkan format `"top top-=64px"` bila meleset). Mobile 390px + RM: tanpa error, Smoother mati. Gate: `tsc 0, oxlint 0, build lulus`.
Hasil PASS 2026-11-14: format generik `"top top+=64px"` (rectTop=64 untuk #skills); KASUS KHUSUS #about → `scrollTo(HERO_MASTER_PX)` (lib/scroll — dulu literal 200) karena section overlap hero di docTop=0 (offset elemen ter-clamp ke 0). Mobile 390px + RM: smoother=false, tanpa error. Gate: tsc 0, oxlint 0, build lulus.

- [x] **Step 4: Fix temuan reviewronde 1 (perebutan transform + kerapuhan)**

  Review independen (subagent) → NEEDS-FIX, 6 item Important:
  1. `.tilt-scene data-speed="5"` direbut Smoother (ratio 5x → translate 584px) + tween manual yPercent = transform ganda. FIX: rename → `data-tilt-speed` (dibaca manual `el.dataset.tiltSpeed`), Smoother effects tinggal 1. PROBE PASS: tilt translate 0px saat load; parallax manual ±5% normal; #projects rectTop=64.
  2. `.hero-scroll` ditulis timeline (y) + Smoother effects (data-speed 0.85) = perebutan per tick. FIX: timeline jadi opacity-only, gerak milik Smoother. PROBE PASS: effects=1, hint translate Smoother aktif.
  3. `MASTER_PX=200` tersebar di 4 file (Hero, hook, About.css, BlackHoleScene). FIX: `src/lib/scroll.ts` → `HERO_MASTER_PX`; semua konsumen impor (CSS salin angka + komentar). PROBE PASS: #about y=200 + live.
  4. Guard `window.innerWidth` sekali-saat-mount (hook Hero/About/Topo). FIX: hook baru `useDesktop` (matchMedia min-width:901px, pola useReducedMotion); keempat konsumen reaktif + cleanup aman. PROBE PASS: desktop→mobile→desktop tanpa error, smoother on→off→on, pin 1→0→1, anchor tetap y=200+live.
  5. Cleanup tanpa `ScrollTrigger.refresh()` setelah kill. FIX: tambah refresh di cleanup hook. (Tercakup probe resize di atas.)
  6. Cast inline duplikat di Journey/Orbit. FIX: `SmootherHandle` diimpor dari hook; Journey declare global, Orbit anotasi tipe. Komentar "tanpa Lenis" → "tanpa Smoother"; seed OrbitProgress via `st.progress` (pola Cosmos).
  DEFERRED: pengetatan tipe `gsap.ts` (`as unknown` struktural — kelas 3.15 tanpa tipe `create` statis; deklarasi modul manual = risiko tanpa benefit runtime); offset nav 64px tak tertaut `--nav-h`; komentar Cosmos terpotong.

---

## Self-Review

1. Spec coverage: §6.1→Task 1+2; §6.2→Task 3; §6.3→Task 2+3; §6.4→Task 1; §6.5→dihapus (kuantizer dilepas — tidak ada guard yang perlu diganti); §6.6→Task 4+5; §6.7→Task 4 Step 2; §6.8→Task 5. Keputusan pasca-check (kuantizer dilepas, boleh betulkan angka, mobile mati) tercermin di Global Constraints + Task 4/5.
2. Step scan: tiap step satu aksi + hasil checkable; tidak ada "TBD".
3. Type consistency: `window.__smoother: ScrollSmoother | undefined`; `scrollTo(target, smooth?, position?)` konsisten Task 2-3.
4. Review Focus: 5 risiko + pemilik ujinya tertulis; tiap baris punya probe di Task 5.
5. Proportion: plan ~120 baris untuk spec ~150 baris — ringkas, tanpa transcript body.
