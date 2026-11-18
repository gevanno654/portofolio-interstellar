# Hero Idle Roll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah idle roll per-karakter di baris GEVANNO YOH, berhenti + reset setelah 5 detik.

**Architecture:** Satu timeline GSAP `repeat:-1` di `useGsapScope` Hero (setelah intro): roll `yPercent 0→-115` stagger, `set +115`, kembali ke 0, jeda antar putaran; `gsap.delayedCall` kill tepat 5.0 dtk setelah idle mulai + reset `yPercent:0`. Idle menulis `.char` (nama), exit scroll menulis `.hero-content` — beda elemen, tak berebut.

**Tech Stack:** React 19, GSAP 3.15 (timeline + delayedCall), TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-15-hero-idle-roll-design.md`

## Global Constraints

- Baris target: GEVANNO (`.line-name-main .char`) + YOH (`.line-name-sub .char`) SAJA — "Hello! I'm", role, scroll-hint tak tersentuh.
- Kill TEPAT 5.0 detik setelah idle mulai (potong mid-putaran, reset instan) — keputusan user yang disetujui.
- Idle `delay: 2.0` — intro char terakhir selesai 1.815 dtk (0.25+19×0.035+0.9); margin ~0.2 dtk, tak boleh tabrakan transform.
- Reduced-motion: tidak ada idle sama sekali (return awal existing).
- Mask `.line` sudah `overflow:hidden` — tak perlu CSS baru.
- Folder bukan git: tanpa commit; rollback manual per file.
- Bahasa komentar kode: Indonesia, to the point.

## Review Focus

- Idle vs intro overlap saat load lambat (intro tertunda > 1.7 dtk): idle menimpa huruf yang belum selesai intro — ekspektasi: tak ada flicker.
- Unmount < 5 dtk (navigasi cepat): delayedCall + timeline bocor — ekspektasi: cleanup melepas keduanya.
- Scroll saat idle jalan (exit scrub + roll bersamaan): exit di container, roll di char — ekspektasi: tak ada stuck, roll di-kill saat scroll mulai.
- StrictMode double-invoke: dua timeline + dua timer — ekspektasi: cleanup pertama melepas pasangannya.
- Mask `.line` di mobile (tanpa pin): huruf ±115% terpotong dalam baris — ekspektasi: sama seperti desktop.

---

### Task 1: Timeline idle roll + kill 5 detik

**Files:**
- Modify: `src/components/Hero.tsx` (setelah `tl` intro baris 43-48, sebelum master/exit)

**Interfaces:**
- Consumes: `gsap` dari `../lib/gsap` (existing); `useGsapScope` cleanup tambahan (return fungsi).
- Produces: timeline `roll` (repeat:-1, delay 2.0) + delayedCall kill; cleanup melepas keduanya.

- [x] **Step 1: Tulis selektor target + timeline roll**

  Tambah setelah `tl` intro (masih dalam `useGsapScope`, setelah `if (reduced) return;`):
  selektor `".line-name-main .char, .line-name-sub .char"`.
  Timeline: `gsap.timeline({ repeat: -1, delay: 2.0, defaults: { ease: "power2.inOut" } })`
  dengan `.to(chars, { yPercent: -115, duration: 0.45, stagger: 0.02 })`,
  `.set(chars, { yPercent: 115 })`,
  `.to(chars, { yPercent: 0, duration: 0.45, stagger: 0.02 })`,
  `.to({}, { duration: 0.6 })` (jeda antar putaran).
  RALAT reviewer ronde 1: delay awal 1.7 salah hitung (intro char terakhir
  selesai 1.815, bukan ~1.65) → 2.0 dengan margin ~0.2 dtk.

- [x] **Step 2: Tulis kill tepat 5 detik + reset**

  `const killer = gsap.delayedCall(2.0 + 5, () => { roll.kill(); gsap.set(chars, { yPercent: 0 }); });`
  Return cleanup dari setup: `() => { killer.kill(); roll.kill(); gsap.set(chars, { yPercent: 0 }); }`
  (aman bila unmount < 5 dtk atau StrictMode double-invoke).

- [x] **Step 3: Verifikasi tsc + oxlint + build**

  Run: `npx tsc --noEmit; npx oxlint src; npm run build` dari `D:\CodeProject\Portofolio`
  Expected: tsc exit 0, oxlint exit 0, `built in` tanpa error.

- [x] **Step 4: Probe visual idle + exit**

  Dev server `npm run dev -- --port 5173 --host 127.0.0.1` + puppeteer `vprobe.cjs` sementara (hapus setelahnya):
  - t≈1.8 dtk: semua `.char` nama `yPercent == 0` (intro selesai, roll delay 2.0 belum mulai — anti-flicker).
  - t≈3.3 dtk: `.char` nama bergerak (roll jalan).
  - t≈8.3 dtk: semua `.char` nama `yPercent == 0` (kill 2.0+5 + reset).
  - Scroll 200px: exit PASS lama (heroOp=0, about-live=true) — idle tak merusak exit.
  Expected: keempat kondisi PASS, tanpa PAGEERROR.
  Hasil 2026-11-15: T1.8 moving=0, T3.3 moving=1, T8.3 moving=0; EXIT y=200 heroOp=0 live=true. PASS.

---

## Self-Review

1. Spec coverage: goals (roll per-karakter, delay 2.0, kill 5.0, RM mati) → Task 1 Step 1-2; non-goals (baris lain tak tersentuh) di Constraints + selektor Step 1; anti-goals (tabrakan intro/exit, jalan selamanya) → Review Focus + probe Step 4.
2. Step scan: tiap step satu aksi + hasil checkable; tidak ada "TBD". Satu task saja — pekerjaan kecil (∼15 baris), tak layak dipecah (reviewer tak bisa menolak kill tanpa menolak roll).
3. Type consistency: `gsap.timeline`, `gsap.delayedCall`, `gsap.set` — API existing yang sudah dipakai di codebase; tak ada tipe baru.
4. Review Focus: 5 risiko + ekspektasi perilaku tiap baris; kunci (overlap intro, bocor timer, tabrakan exit, StrictMode, mask mobile) tercakup probe/kode.
5. Proportion: plan ~60 baris untuk spec ~70 baris — ringkas, tanpa transcript body.
