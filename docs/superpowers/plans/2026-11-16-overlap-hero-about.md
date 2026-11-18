# Overlap Hero→About ala Moncy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** About menumpuk hero (pin + overlap) sehingga dissolve menyatu tanpa zona mati, travel slot tetap jalan.

**Architecture:** Pin hero 1 viewport (pinSpacing true); about `margin-top: -100svh` menumpuk di atasnya dengan counter y +100svh→0; hero exit + travel + word-rise di-scrub dalam rentang pin yang sama; semua tween ≤2:1, ukuran slot tetap.

**Tech Stack:** React 19, GSAP 3.15 ScrollTrigger + ScrollSmoother inti, TypeScript, Vite, puppeteer-core probe.

**Spec:** `docs/superpowers/specs/2026-11-16-overlap-hero-about-design.md`

## Global Constraints

- DILARANG `gsap-trial`; ScrollSmoother dari `gsap/ScrollSmoother` inti.
- Rasio gerak:scroll >2:1 DILARANG di titik mana pun (probe tiap 100px); bila RED → STOP + lapor, bukan menambal.
- Width slot TETAP 90vw (tak di-tween); ujung tween numerik (tanpa `auto`).
- Mobile ≤900px + RM: tanpa pin/overlap (alir natural existing).
- Tanpa karakter/humanoid/foto/wajah; copy hero/about tetap.
- Folder bukan git; komentar Indonesia; tiap task: tsc 0, oxlint 0, build + probe.

## Review Focus

- Pin menahan scroll 1 viewport: anchor `#about` mendarat di konten about (bukan di pin-spacer) — ekspektasi: rectTop ≈ 64 di bawah nav.
- Scroll balik: slot l=461 w=1296 + hero opacity 1 persis (reversibel).
- Word-rise parkir 0 di akhir pin; headline intro once + roll jalan.
- Kurva fade lubang selama pin: lubang penuh sepanjang dissolve (mix 1).
- Mobile 390px + RM: tanpa pin, tanpa error, Smoother mati.

---

### Task 1: Pin hero + overlap about (kerangka dissolve)

**Files:**
- Modify: `src/components/Hero.tsx:89-131` (master exit desktop: tambah pin)
- Modify: `src/components/About.css:6-28` (margin overlap desktop)

**Interfaces:**
- Consumes: `.hero` scope (trigger), `#about` (konten menumpuk).
- Produces: pin 1 viewport (`end: "+=100%"`, `pinSpacing: true`); about `margin-top: -100svh` desktop non-RM.

- [ ] **Step 1: Tambah pin pada master exit Hero.tsx desktop**

Ubah ScrollTrigger master: tambah `pin: true, pinSpacing: true, end: "+=100%"` (start tetap `"top top"`, scrub 0.6). Exit tween (yPercent 40 + fade) tetap — berjalan dalam rentang pin.
Expected: tsc 0.

- [ ] **Step 2: Tambah margin overlap About.css desktop**

Dalam `@media (min-width: 901px)`: `.about { margin-top: -100svh; }` (+ komentar: menumpuk hero selama pin; mobile/RM tanpa overlap).
Expected: build lulus.

- [ ] **Step 3: Probe kerangka — pin menahan + about menumpuk**

Run probe imperatif tiap 100px y=0–1200: catat `window.scrollY`, rect `.hero`, `#about`, opacity hero. Expected: hero pin (rect top 0 selama ~900px scroll); about menumpuk (rect top turun 1:1 menutup hero); ERRS=0.
- [ ] **Step 4: Verifikasi tsc + oxlint + build**

Run: `npx tsc --noEmit; npx oxlint src; npm run build`
Expected: tsc 0, oxlint 0, build ✓.

---

### Task 2: Counter about + dissolve menyatu (tanpa zona mati)

**Files:**
- Modify: `src/components/About.tsx:112-139` (tl entrance: trigger + counter)

**Interfaces:**
- Consumes: rentang pin Task 1 (trigger `#about`, start/end dipetakan ke pin).
- Produces: about y `+100svh→0` scrub 0.6 (counter = visual diam ala slide moncy); word-rise + headline-trigger tetap jalan dalam rentang yang sama.

- [ ] **Step 1: Tambah counter + petakan trigger entrance ke rentang pin**

Tl About.tsx: tambah tween kontainer about `y: "100svh"→0` (scrub 0.6, posisi 0); word-rise tetap; trigger start/end disesuaikan agar entrance penuh dalam rentang pin (tuning via probe Task 2 Step 3).
Expected: tsc 0.

- [ ] **Step 2: Probe dissolve — rasio ≤2:1 + tanpa zona kosong**

Run probe tiap 100px: untuk tiap titik catat heroOp + word moving/top + slotL. Expected: GREEN bila (a) tiap titik ada teks terlihat (heroOp>0.1 ATAU kata di viewport), (b) maxStep gerak/paragraf per 100px scroll ≤200px (rasio ≤2:1), (c) kata parkir 0 di akhir. Bila RED → STOP + lapor (jangan Task 3).
- [ ] **Step 3: Screenshot MID dissolve + verifikasi tsc/oxlint/build**

Screenshot y tengah pin (hero samar + about terbaca). Run tsc/oxlint/build. Expected: visual dissolve menyatu; tsc 0, oxlint 0, build ✓.

---

### Task 3: Travel + mirror + fade dalam rentang pin

**Files:**
- Modify: `src/components/Cosmos.tsx:82-121` (trigger travel → rentang pin)
- Modify: `src/three/BlackHoleScene.ts:424-442` (kurva fade bila perlu)

**Interfaces:**
- Consumes: rentang pin Task 1 (trigger `#about` start/end yang sama).
- Produces: travel `right -22vw→48vw` (width tetap, ujung numerik) + `onUpdate` mirror/slim dalam rentang pin; fade lubang mix 1 sepanjang pin.

- [ ] **Step 1: Petakan trigger travel ke rentang pin**

Ubah ScrollTrigger travel: trigger/start/end selaras rentang pin Task 1 (nilai akhir dari probe Task 2). Tween + onUpdate (mirror/slim) tetap.
Expected: tsc 0.

- [ ] **Step 2: Sesuaikan kurva fade bila probe menunjukkan luruh selama pin**

Hanya bila mix <1 selama pin: about menumpuk = rect selalu terlihat → sesuaikan ambang `aboutEl` rect (nilai dari probe). Tanpa perubahan bila mix sudah 1.
Expected: mix 1 sepanjang dissolve, luruh setelah about lewat.

- [ ] **Step 3: Probe penuh + BACK + mobile/RM + gate akhir**

Probe tiap 100px y=0–1400 + BACK ke 0: (a) slotL 461→−547 ukuran 1296 tetap, maxStep<150; (b) BACK l=461 w=1296 heroOp=1; (c) mobile 390px + RM: tanpa pin, tanpa error; (d) screenshot LOAD/MID/FULL/BACK. Run tsc/oxlint/build. Expected: semua GREEN, ERRS=0, tsc 0, oxlint 0, build ✓.
