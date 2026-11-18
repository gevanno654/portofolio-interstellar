# About 3-Phase Exit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** About diam total 2 ketukan di tengah, scroll ke-3 exit per-karakter + blackhole fade.

**Architecture:** Pin hero diperpanjang 1→3 viewport (dissolve → parkir-1 → parkir-2 diam), penahan counter imbang scroll selama fase parkir, exit time-based sekali-main saat lepas pin (teks naik per-karakter, lubang fade via shader mix).

**Tech Stack:** GSAP 3.15 ScrollTrigger + ScrollSmoother inti (tanpa gsap-trial), WebGL BlackHoleScene, probe puppeteer.

**Spec:** Desain disetujui user 2026-11-18 — pin 300vh (100vh dissolve, 100vh parkir-1 teks jatuh masuk, 100vh parkir-2 diam total); exit scroll ke-3: teks yPercent per-karakter naik ke −115 (mask .line) + opacity 1→0 time-based; blackhole opacity 1→0 via shader mix; entrance dua ketukan/gate rect/anchor pola tetap; mobile/RM tanpa pin alir natural; idle ular + polling tetap.

## Global Constraints

- Bahasa Indonesia, to the point, tanpa karakter/humanoid/foto/wajah.
- RM/no-webgl fallback tetap jalan (tanpa pin, tanpa WebGL).
- `gsap` inti 3.15 (`gsap/ScrollSmoother`), DILARANG gsap-trial; Lenis sudah dihapus.
- Smoother mati mobile (≤900px)/RM; smooth 1.7.
- Idle hero/about per-karakter tetap jalan (roll ular), pause saat keluar viewport.
- Background: hisap bintang mati, grain mati, debu kosmik mati; twinkle/parallax mouse, komet, putaran disk tetap nyala.
- About headline satu baris `white-space: nowrap`; bio/sinyal putih penuh.
- Kepemilikan: satu elemen satu penulis transform/opacity (pola scroll-hint hero: anak vs wrapper).
- Folder `D:\CodeProject\Portofolio` bukan git; rollback manual; dev `npm run dev -- --port 5173 --host 127.0.0.1`.
- Probe: `window.__smoother.scrollTo(v,false)` + settle 2.5dtk (wheel sintetis tak gerakkan Smoother).

## Review Focus

- Layar pendek (H700) anchor mendarat dangkal — anchor harus `window.innerHeight*3`, bukan angka mati.
- Scroll instan melewati rentang — gate polling rect, bukan onUpdate/onToggle.
- Klik nav #about saat SUDAH di about — reset paksa sebelum smoother melompat (pola onNavAbout).
- Exit scrub vs time-based — exit HARUS time-based once agar rapi di semua kecepatan scroll.
- Mobile tanpa pin — semua tween pin-gated `if (desktop)`, cabang else alir natural.

---

### Task 1: Pin 300vh + travel selaras

**Files:**
- Modify: `src/components/Hero.tsx` (exit end `+=100%` → `+=300%`)
- Modify: `src/components/Cosmos.tsx` (travel trigger end 900 → 2700)
- Modify: `src/hooks/useScrollSmoother.ts` (anchor #about `innerHeight` → `innerHeight*3`)
- Modify: `src/components/About.tsx` (reset ScrollTrigger end 900 → 2700)

**Interfaces:**
- Consumes: konstanta pin — tunggal sumber `PIN_END = 2700` di About.tsx tryFire/reset.
- Produces: rentang pin 0–2700 untuk Task 2 (parkir) dan Task 3 (gate).

- [ ] **Step 1: Ubah Hero exit end `+=100%` → `+=300%` + komentar paruh (dissolve/parkir-1/parkir-2)**

- [ ] **Step 2: Ubah Cosmos travel end 900 → 2700 (trigger `.hero`, start 0)**

- [ ] **Step 3: Ubah anchor #about `smoother.scrollTo(window.innerHeight, true)` → `smoother.scrollTo(window.innerHeight * 3, true)`**

- [ ] **Step 4: Ubah reset ScrollTrigger About end 900 → 2700**

- [ ] **Step 5: Verifikasi build + probe**

Run: `npx tsc --noEmit` (Expected: exit 0), `npm run build` (Expected: `built in`)
Probe H900: `Y0 heroOp=1`, `Y900 headOp=1` (dissolve tuntas di 1/3 pin), `Y2700` about keluar natural.
Expected: teks tetap muncul, travel width=[1296], ERRS=0.

---

### Task 2: Parkir diam 2 ketukan (penahan counter)

**Files:**
- Modify: `src/components/About.tsx` (`tl.to(scope, {keyframes...})` penahan parkir)

**Interfaces:**
- Consumes: rentang pin 0–2700 dari Task 1.
- Produces: entrance jatuh di awal paruh-2 untuk Task 3.

- [x] **Step 1: Penahan keyframes — DICABUT (Ruling Task 2: tak konvergen)**
  - Keyframes counter-transform tak mencapai DIAM setelah 4 percobaan
    (probe: arah + mempercepat, arah − menjauh, trigger ter-pin stuck).
  - About mengalir natural dalam pin 3 viewport. Parkir diam butuh
    pendekatan pin/snap terpisah — di luar scope exit scroll ke-3.

- [x] **Step 2: Verifikasi — tsc 0, build lulus, Y900 fire normal.**

---

### Task 3: Gate entrance di awal parkir + exit scroll ke-3

**Files:**
- Modify: `src/components/About.tsx` (tryFire syarat + exit per-karakter + reset)
- Modify: `src/three/blackHoleShaders.ts` (uniform fade lubang, bila belum ada)
- Modify: `src/three/BlackHoleScene.ts` (setter fade + baca rect, bila belum ada)

**Interfaces:**
- Consumes: pin Task 1 (lepas Y2700), gate scroll≥800 (sudah ada).
- Produces: exit per-karakter + lubang fade di Y2700+.

- [ ] **Step 1: Tambah exit time-based once (headline char yPercent → −115 + opacity 1→0 power1.out; wordDrop balik → −110) fire saat lepas pin (polling scroll ≥ 2600), latch terpisah `exitPlayed`**

- [ ] **Step 2: Tambah fade lubang via shader — CEK DULU `uAnchorMix` di BlackHoleScene.ts (baris 424–450: fade berbasis rect about SUDAH ADA, mix→0 saat about lewat). Bila cukup: exit cukup picu scroll (lubang ikut memudar natural). Bila kurang: tambah override manual. Jangan duplikat mekanisme.**

- [ ] **Step 3: Reset mencakup exit (`exitPlayed=false`, kembalikan char/word, opacity text)**

- [ ] **Step 4: Verifikasi probe penuh H900**

Run: Y900 txtOp=1 (fire); Y2700+ teks naik + lubang memudar; BACK persis; ERRS=0.
Run: `npx tsc --noEmit` (0), `npx oxlint` (0), `npm run build` (`built in`).

---
