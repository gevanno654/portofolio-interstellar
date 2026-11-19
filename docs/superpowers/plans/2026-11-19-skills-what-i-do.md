# Skills "What I Do" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti section Skills menjadi "What I Do" berisi 3 blok (Develop / Design / Operator Broadcast), blok Develop memakai batu 3D prosedural (kiri canvas, kanan teks) dengan enter grow-in dan exit zoom-fade scrub.

**Architecture:** Scene Three.js baru yang terisolasi (`spaceRock.ts`, pola mount/dispose seperti `createScene`) + komponen wrapper `SkillRock.tsx` + rewrite `Skills.tsx`/`Skills.css` menjadi 3 blok alternating. Hapus `SkillsConstellation.*` total. Animasi mengikuti pola scrub About (`scrub 0.6`, `ease none`, `fromTo` + `immediateRender:false`, reversibel).

**Tech Stack:** Three.js 0.187 (dependensi yang ada), GSAP 3.15 inti + ScrollTrigger via `src/lib/gsap.ts`, `useGsapScope`, `useReducedMotion`.

**Spec:** Persetujuan user 2026-11-19 — judul "What I Do"; isi 1 Develop, 2 Design, 3 Operator Broadcast, masing-masing elemen 3D sendiri; tahap ini Develop full (batu seperti referensi), blok 2–3 layout + teks final dengan placeholder panel (elemen 3D menyusul); batu enter kecil→besar, exit zoom membesar + opacity menurun mengikuti scrub; posisi Develop kiri canvas + kanan teks, Design cermin (kiri teks + kanan visual); batu melayang + rotasi pelan; teks Develop = item frontend yang ada; tanpa karakter/humanoid/foto/wajah; RM/no-WebGL fallback tetap jalan.

## Global Constraints

- GSAP inti 3.15 via `src/lib/gsap.ts` (`gsap/ScrollSmoother`); DILARANG gs-trial; Lenis tidak dipakai; Smoother mati mobile (≤900px)/RM; smooth 1.7.
- Pola animasi scroll: `scrub: 0.6`, `ease: "none"`, `fromTo` + `immediateRender: false`, reversibel (scroll balik = kembali).
- `useGsapScope` untuk semua ScrollTrigger (auto-cleanup, aman StrictMode); lifecycle Three.js di `useEffect` terpisah dengan `dispose()`.
- RM (`prefers-reduced-motion`): semua konten tampil statis, tanpa RAF loop, tanpa trigger.
- No-WebGL: fallback CSS radial-gradient, tanpa crash; konten teks selalu ada.
- Tanpa karakter/humanoid/foto/wajah di mana pun.
- Teks hero tetap tidak tersentuh; trigger exit About tidak tersentuh (trigger baru hidup di bawahnya).
- Verifikasi tiap task: `npx tsc --noEmit` (TSC=0) + `npm run build` lulus; probe headless bila relevan (ERRS=0); probe sementara `.cjs` dihapus setelah hijau.
- Jangan tempel token/PAT/password di chat; kredensial hanya via OS (`gh auth`).

## Review Focus

- No-WebGL (WebGL dimatikan): fallback batu CSS tampil, teks Develop utuh, tanpa error — uji dengan flag `--disable-gpu`/WebGL block di probe, pemilik Task 3.
- Reduced motion: batu statis terlihat (frame pertama render, tanpa loop), semua teks opacity 1 tanpa trigger — uji emulasi `prefers-reduced-motion`, pemilik Task 4.
- Layar sempit (≤800px): blok stack 1 kolom, visual di atas teks untuk semua blok termasuk flip — uji viewport 390px, pemilik Task 4.
- Exit scrub blok Develop tidak menggeser/memicu trigger exit About di atasnya (state terpisah, trigger terpisah) — uji regresi probe About exit 0.667/0.333/0, pemilik Task 5.
- Determinisme batu: seed noise tetap sehingga screenshot stabil antar reload — uji dua reload, pixel diff ~0 di luar anti-alias, pemilik Task 2.

---

### Task 1: Konten `whatIDo`

**Files:**
- Modify: `src/content.ts:53-84` (tambah `whatIDo`, `skillGroups` dibiarkan apa adanya)
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: item frontend existing (`skillGroups` id `frontend`) sebagai sumber teks Develop.
- Produces: `export const whatIDo: WhatIDoItem[]` dengan `WhatIDoItem = { id: string; index: "01"|"02"|"03"; title: string; lede: string; items: string[] }`. Isi: `develop` (title "Develop", items = ["React","Vite","GSAP","Three.js", plus "TODO — tambah/hapus"] + lede 1 kalimat), `design` (title "Design", items ["TODO — mis. Figma","TODO — mis. Design system"], lede placeholder jujur), `broadcast` (title "Operator Broadcast", items ["TODO — mis. OBS","TODO — mis. Live switching"], lede placeholder jujur).

- [ ] **Step 1: Tambah tipe + konstanta `whatIDo`** di `src/content.ts` setelah `skillGroups` (tanpa mengubah `skillGroups`), pakai nilai exact dari Interfaces.
- [ ] **Step 2: Verifikasi** — Run: `npx tsc --noEmit`. Expected: exit 0, tanpa error.
- [ ] **Step 3: Commit** — `git add src/content.ts && git commit -m "content: tambah whatIDo (Develop/Design/Operator Broadcast)"`.

### Task 2: Scene batu `spaceRock.ts`

**Files:**
- Create: `src/three/spaceRock.ts`
- Test: probe `probe-rock.cjs` (sementara, hapus setelah hijau)

**Interfaces:**
- Consumes: `three` (dependensi existing). Tidak memakai `BlackHoleScene` (scene terpisah, background transparan).
- Produces: `export type RockHandle = { dispose: () => void; ok: boolean }`; `export function createSpaceRock(container: HTMLElement): RockHandle`. Batu: `IcosahedronGeometry(1, 5)` + displacement noise deterministik (seed tetap, amplitudo ~0.28, frekuensi campuran sin 3 sumbu — perilaku referensi: tonjolan tak beraturan, bukan bola mulus); tekstur kawah dari offscreen canvas 512 (dasar abu kecoklatan `#8d8177`, ±40 kawah elips gelap `#4a423b` + highlight tepi, dipakai sebagai `map` + `bumpMap`); `MeshStandardMaterial({ roughness: 1, metalness: 0 })`; cahaya: directional hangat `0xffe2b8` intensitas 2.2 dari kiri-atas-depan + rim biru `0x6ea8ff` 1.2 dari kanan-belakang + ambient `0x223044` 0.6; kamera perspective 35°, z 3.2; renderer `alpha: true`, pixelRatio `min(devicePixelRatio, 2)`; idle RAF: `y = sin(t*0.6)*0.12`, `rotation.y += dt*0.15`, `rotation.x = 0.35 + sin(t*0.23)*0.08`; resize mengikuti container via `ResizeObserver`; WebGL gagal → `ok: false` tanpa throw.

- [ ] **Step 1: Tulis probe gagal dulu** `probe-rock.cjs`: mount dev server, cek `document.querySelector('.rock-canvas canvas')` ada + `__rockOk === true`. Run: `node probe-rock.cjs`. Expected: FAIL (file/elemen belum ada).
- [ ] **Step 2: Implementasikan `createSpaceRock`** di `src/three/spaceRock.ts` dengan nilai exact dari Interfaces. Catatan algoritma (satu-satunya bagian yang signature tidak menentukan): displacement `p += normal * (0.28*sin(3.1x+s)*sin(2.7y)*sin(3.3z) + 0.12*sin(7x)*sin(6.3y+1.7)*sin(5.6z+0.6))` dengan seed offset `s = 1.37`; hitung `computeVertexNormals()` setelahnya.
- [ ] **Step 3: Verifikasi** — Run: `npx tsc --noEmit` (TSC=0), `npm run build` (ada `built in`), `node probe-rock.cjs` (canvas ada, ERRS=0). Hapus `probe-rock.cjs`.
- [ ] **Step 4: Commit** — `git add src/three/spaceRock.ts && git commit -m "3d: tambah spaceRock prosedural (batu kawah + float + rotasi)"`.

### Task 3: Komponen `SkillRock.tsx`

**Files:**
- Create: `src/components/SkillRock.tsx`
- Create: `src/components/SkillRock.css`
- Test: `npx tsc --noEmit` + probe no-WebGL

**Interfaces:**
- Consumes: `createSpaceRock` dari Task 2.
- Produces: default export `SkillRock({ className?: string })` — render `<div className="rock-stage">` + canvas via `useEffect` mount/`dispose` cleanup; bila `ok === false` render `.rock-fallback` (radial-gradient abu + 6 bintik kawah via `radial-gradient` ganda, murni CSS). Set `(window as any).__rockOk = handle.ok` untuk probe. RM: tetap mount (frame statis — loop dimatikan via `matchMedia` check di dalam effect: mount, render 1 frame, langsung `dispose` loop tapi biarkan canvas terakhir? Sederhanakan: teruskan `reduced` sebagai prop? TIDAK — komponen baca `useReducedMotion()` sendiri dan teruskan ke `createSpaceRock(container, { frozen: reduced })`; `frozen=true` = render tepat 1 frame, tanpa RAF). Ini mengubah signature Task 2: `createSpaceRock(container: HTMLElement, opts?: { frozen?: boolean }): RockHandle`.

- [ ] **Step 1: Update signature Task 2** — tambah `opts?: { frozen?: boolean }`; `frozen` = render 1 frame tanpa RAF/resize-loop (ResizeObserver tetap boleh, murah).
- [ ] **Step 2: Tulis `SkillRock.tsx` + `SkillRock.css`** sesuai Interfaces (fallback CSS tanpa gambar eksternal).
- [ ] **Step 3: Verifikasi** — Run: `npx tsc --noEmit` (TSC=0); probe normal: canvas ada + `__rockOk true`; probe no-WebGL (`--disable-gpu`): `.rock-fallback` tampil, ERRS=0. Hapus probe.
- [ ] **Step 4: Commit** — `git add src/components/SkillRock.tsx src/components/SkillRock.css src/three/spaceRock.ts && git commit -m "skills: tambah SkillRock + fallback no-webgl"`.

### Task 4: Rewrite Skills menjadi "What I Do"

**Files:**
- Modify: `src/components/Skills.tsx` (rewrite penuh)
- Modify: `src/components/Skills.css` (rewrite penuh, pertahankan `#skills` padding napas)
- Delete: `src/components/SkillsConstellation.tsx`, `src/components/SkillsConstellation.css`
- Test: probe `probe-doing.cjs` (sementara)

**Interfaces:**
- Consumes: `whatIDo` (Task 1), `SkillRock` (Task 3), `useGsapScope`/`useReducedMotion`/`gsap` (pola existing).
- Produces: section `#skills` berisi tag `02 // Capabilities`, h2 `What I <em>Do</em>`, lede 1 kalimat, lalu 3× `.doing-block[data-item]` masing-masing `min-height: 92vh`, grid 2 kolom (`1fr 1.1fr`); blok 2 `.flip` (teks kiri, visual kanan); blok 1 visual = `<SkillRock/>`, blok 2–3 visual = `.doing-placeholder` (panel dashed + mono "3D ELEMENT — TBD"); copy = index, h3, lede, ul readout `/`-separator (reuse gaya `.sys-*` → rename `.doing-*`). Animasi (non-RM saja): enter per blok `fromTo(visual, {scale:0.3,opacity:0} → {scale:1,opacity:1, duration:1, ease:"power3.out", trigger top 78%})` + copy `y:44→0`; exit blok 1–2 (scrub, reversibel): `fromTo(block, {scale:1,opacity:1} → {scale:1.35,opacity:0, ease:"none", duration:1, immediateRender:false, scrollTrigger:{trigger:block, start:"center 40%", end:"bottom top", scrub:0.6}})`. RM: early return, semua opacity 1.

- [ ] **Step 1: Rewrite `Skills.tsx`** sesuai Interfaces; hapus import `skillGroups`/`SkillsConstellation`.
- [ ] **Step 2: Rewrite `Skills.css`** (grid blok, flip, placeholder, readout; media ≤800px 1 kolom visual-atas; pertahankan `#skills{padding-top:clamp(3rem,7vh,5rem)}`).
- [ ] **Step 3: Hapus constellation** — `git rm src/components/SkillsConstellation.tsx src/components/SkillsConstellation.css`.
- [ ] **Step 4: Verifikasi** — `npx tsc --noEmit` (TSC=0), `npm run build` lulus; probe: judul "What I Do" ada, constellation hilang, canvas batu di blok 1, blok 2 flip (visual kanan), exit blok 1 mencapai `opacity 0` saat blok 2 di tengah + balik `1` saat scroll kembali, ERRS=0. Uji RM emulate + viewport 390px. Hapus probe.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "skills: rewrite What I Do + batu Develop + exit zoom-fade"`.

### Task 5: Regresi + push

**Files:** — (hanya verifikasi)

- [ ] **Step 1: Regresi About exit** — probe: tengah 1/1 → K1 0.667 → K2 0.333 → K3 0/0 → balik 1/1, ERRS=0 (aturan lama tak tersentuh).
- [ ] **Step 2: Regresi nav + hero** — klik nav `#about` 2× dari tengah diam (opacity tetap 1); hero dissolve utuh.
- [ ] **Step 3: Push** — `git push origin main`; bila gantung, pakai `GIT_TERMINAL_PROMPT=0` + `git -c credential.helper=manager push origin main`.

## Self-Review

1. **Spec coverage:** Judul What I Do (T4) · 3 item Develop/Design/Broadcast (T1+T4) · elemen 3D per item, tahap ini batu Develop + placeholder 2–3 (T2+T3+T4) · batu mirip referensi (T2: displacement + kawah + cahaya hangat kiri) · enter kecil→besar (T4) · exit zoom+fade scrub (T4) · kiri canvas/kanan teks Develop, Design cermin (T4) · float+rotasi (T2) · teks frontend existing (T1) · hapus tampilan gambar 2/constellation (T4) · RM/no-WebGL fallback (T2+T3) · tanpa humanoid (CSS/SVG saja).
2. **Step scan:** tiap step satu aksi + hasil cek; tidak ada "TBD" (placeholder Design/Broadcast eksplisit panel + teks TODO); body algoritma hanya di T2-Step 2 (noise displacement — memang tidak ditentukan signature).
3. **Type consistency:** `createSpaceRock(container, opts?: {frozen?: boolean}) → RockHandle {dispose, ok}` dipakai konsisten T2→T3; `whatIDo: WhatIDoItem[]` T1→T4; `SkillRock({className?})` T3→T4.
4. **Review Focus:** 5 baris terisi, tiap baris menunjuk pemilik task + uji konkret.
5. **Proportion:** plan ~120 baris untuk ±400 baris kode baru — proporsional, bukan transkrip.
