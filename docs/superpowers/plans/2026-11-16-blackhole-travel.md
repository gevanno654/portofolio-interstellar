# Blackhole Travel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blackhole travel kanan→kiri mengiringi about; Taurus keluar dari about.

**Architecture:** Slot fixed di-tween scrub (posisi viewport-space, parallax vs teks); fade mix ditulis ulang berbasis visibilitas about; AboutTopography dicabut dari About (file tetap untuk section lain).

**Tech Stack:** React 19, GSAP 3.15 ScrollTrigger scrub, Three.js shader existing (tanpa ubah shader).

**Spec:** `docs/superpowers/specs/2026-11-16-blackhole-travel-design.md`

## Global Constraints

- Travel murni posisi slot DOM; uDolly/uZoom tetap 0; shader tak disentuh.
- Kepemilikan: posisi+skala slot = tween travel; opacity = mix shader; kata = tl about.
- Desktop + non-RM saja (mobile/RM: slot statis, fade existing).
- Folder bukan git; komentar Indonesia; tsc 0, oxlint 0, build + probe + screenshot tiap task; file sementara dihapus.

## Review Focus

- Slot menutupi teks about (kiri viewport vs kolom teks kanan — ekspektasi: tak overlap di 1440px; cek screenshot).
- Fade baru bikin lubang hilang di hero (ekspektasi: LOAD mix=1 penuh kanan).
- Travel tween vs measureSlot tiap frame berebut (ekspektasi: tak ada — tween menulis CSS slot, scene hanya membaca rect).
- Scroll balik: slot kembali kanan (ekspektasi: scrub reversible, lubang ikut).
- Mobile berubah (ekspektasi: slot zona langit tetap, media query tak tersentuh).

---

### Task 1: Cabut Taurus dari about + panggung kiri

**Files:**
- Modify: `src/components/About.tsx` (hapus impor + JSX AboutTopography)
- Modify: `src/components/About.css` (kolom kiri kosong; pastikan teks tetap kanan)

**Interfaces:**
- Consumes: grid `.about-grid` 12 kolom, `.about-text` 5/13.
- Produces: grid tanpa figure; AboutTopography.tsx utuh (dipakai section lain nanti).

- [ ] **Step 1: RED — probe Taurus masih di about**

Puppeteer sementara: LOAD, hitung `.about-visual` count. Expected: 1 (bukti menempel).

- [ ] **Step 2: Hapus AboutTopography dari About**

Hapus impor + `<AboutTopography/>` + komentar kiri; ganti komentar: kolom kiri = panggung lubang travel. Grid + kolom teks tak berubah. Komentar Indonesia.

- [ ] **Step 3: GREEN — probe Taurus hilang + teks utuh**

tsc 0, oxlint 0, build ✓. Probe: `.about-visual` count=0; `.about-sub` opacity 1 saat about terlihat; kata parkir 0. Screenshot about.

---

### Task 2: Tween travel slot kanan→kiri

**Files:**
- Modify: `src/components/Cosmos.tsx` (tween scrub slot) atau `src/components/Hero.tsx`
- Modify: `src/components/Hero.css` (state akhir slot, desktop only)

**Interfaces:**
- Consumes: `.hero-slot-global` fixed (right -22vw, top 52%, 90vw).
- Produces: slot di kiri viewport (~38vw) sepanjang about; reversible via scrub.

- [ ] **Step 1: RED — probe posisi slot statis saat scroll**

Puppeteer: scrollTo about, baca rect `.hero-slot-global` (left/width) di LOAD vs ABOUT. Expected: sama (bukti belum travel).

- [ ] **Step 2: Tulis tween travel scrub**

GSAP tween (scrub 0.6, desktop + non-RM): trigger `#about`, start "top bottom", end "center center": slot width 90vw→38vw, right -22vw→auto, left →2vw, top 52%→50%. Lokasi: Cosmos.tsx (pemilik slot global) — ScrollTrigger.create + gsap.to. Komentar kepemilikan.

- [ ] **Step 3: GREEN — probe travel + screenshot**

tsc 0, oxlint 0, build ✓. Probe: rect slot LOAD (kanan, ~90vw) vs ABOUT (kiri, ~38vw); scroll balik → kembali kanan. Screenshot LOAD + ABOUT (lubang kiri + teks kanan, tak overlap). ERRS=0.

---

### Task 3: Fade bertahan sepanjang about + final

**Files:**
- Modify: `src/three/BlackHoleScene.ts` (kurva mix: berbasis about, bukan scrollY/200)
- Modify: `src/lib/scroll.ts` (HERO_MASTER_PX: pertahankan untuk fade? putuskan: hapus pemakaian bila tak dipakai lagi)

**Interfaces:**
- Consumes: `setHoleVis(v)` existing dari Cosmos; `HERO_MASTER_PX` existing.
- Produces: mix=1 hero, ~1 sepanjang about, →0 setelah about lewat.

- [ ] **Step 1: RED — probe fade lama luruh sebelum about**

Puppeteer: scrollTo about-masuk, baca mix via `__sceneHandle`? (tak ada akses — baca visual: screenshot lubang sudah pudar di about). Expected: lubang pudar/hilang saat about (bukti kurva lama).

- [ ] **Step 2: Tulis ulang kurva fade berbasis about**

Cosmos onUpdate: hitung aboutVis dari rect `#about` (masuk→1, tengah→1, lewat→0 lerp). `setHoleVis(aboutVis)`; scene: mix = aboutVis (lerp existing dipertahankan). Hapus `HERO_MASTER_PX` dari scene bila tak dipakai (cek impor lain: Journey? putuskan per file). Komentar Indonesia.

- [ ] **Step 3: Verifikasi akhir + screenshot**

tsc 0, oxlint 0, build ✓. Probe penuh: LOAD mix penuh kanan; ABOUT lubang kiri penuh + teks; LEWAT (scroll bawah about) lubang luruh; BALIK kembali. Mobile 390px: slot zona langit, tanpa travel. RM: statis. Screenshot semua + hapus file sementara.

---

## Self-Review

1. Spec coverage: travel (T2), fade (T3), Taurus cabut (T1), Sigil otomatis (gerak slot DOM — T2), mobile/RM (T2S2+T3S3).
2. Step scan: tiap step satu aksi + Expected checkable.
3. Type consistency: `.hero-slot-global`, `#about`, `setHoleVis` konsisten.
4. Review Focus: 5 risiko + test di owning task.
5. Proportion: plan ~70 baris untuk spec ~50 — proporsional.
