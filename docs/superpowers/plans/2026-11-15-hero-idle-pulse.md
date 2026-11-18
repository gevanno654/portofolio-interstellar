# Hero Idle Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah idle roll mati-5-detik menjadi denyut selamanya (roll 2 dtk → hening 5 dtk → ulang).

**Architecture:** Ganti blok roll+killer di `useGsapScope` Hero dengan satu timeline `repeat:-1`: naik (stagger renggang 0.06) → set +115 → napas 0.4 → masuk (stagger rapat 0.02) → hening 5.0. Tanpa delayedCall killer; cleanup hanya kill+reset.

**Tech Stack:** React 19, GSAP 3.15, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-15-hero-idle-pulse-design.md`

## Global Constraints

- Target: GEVANNO + YOH saja. Delay awal 2.0 (intro selesai 1.815).
- RM: return awal (existing). Mask `.line` existing. Folder bukan git.
- Komentar Indonesia. Tanpa ubah copy/warna/layout.

## Review Focus (hasil ronde-akhir: READY, 0 Critical/Important)

- Reviewer: ekor stagger naik (0.54) → gerak aktual 2.72 dtk bukan 2.0 — diterima sebagai bagian gelombang (Minor doc, tak di-fix).
- Reviewer: hening PASS tanpa flicker; repeat tanpa drift; scroll+roll komposisi normal; cleanup/RM/StrictMode aman.
- Saran reviewer (dikerjakan 2026-11-16): pause roll saat hero keluar viewport via ScrollTrigger onLeave/onLeaveBack→pause, onEnter/onEnterBack→play (Hero.tsx). Probe: PLAY berubah=true, PAUSE sama=true, RESUME uniq=4 (jalan lagi). Catatan: pause bisa berhenti di posisi +115 (tak terlihat, mask memotong) — lanjut normal saat resume.

- Ekor stagger naik (9×0.06=0.54) membuat roll terlihat ~2.5 dtk bukan 2.0 — ekspektasi: diterima sebagai bagian gelombang.
- Hening 5 dtk: teks penuh 0 di tempat — ekspektasi: hero terbaca normal, tak ada flicker.
- Siklus kedua+ identik dengan pertama (repeat bersih, tanpa drift yPercent) — ekspektasi: posisi reset tiap siklus via set+to.
- Scroll saat roll jalan (exit container + roll char) — ekspektasi: komposisi normal, tak ada stuck.
- Unmount/StrictMode/breakpoint: cleanup kill+reset — ekspektasi: tanpa ghost tween.

---

### Task 1: Timeline denyut + hapus killer

**Files:**
- Modify: `src/components/Hero.tsx` (blok roll ~baris 50-72 + cleanup ~191-199)

**Interfaces:**
- Consumes: `gsap` existing; cleanup return existing.
- Produces: timeline `roll` repeat:-1 (naik/set/napas/masuk/hening); tanpa killer.

- [x] **Step 1: Ganti blok roll dengan struktur denyut**
  Hasil 2026-11-16: implementasi sesuai spec (naik 0.8/stagger 0.06 → set +115 → napas 0.4 → masuk 0.8/stagger 0.02 → hening 5.0); killer + komentar lama dihapus.

  Ganti `delay: 2.0` timeline + `idleKiller` menjadi:
  ```ts
  const roll = gsap.timeline({ repeat: -1, delay: 2.0, defaults: { ease: "power2.inOut" } });
  roll
    .to(NAME_CHARS, { yPercent: -115, duration: 0.8, stagger: 0.06 })
    .set(NAME_CHARS, { yPercent: 115 })
    .to({}, { duration: 0.4 })
    .to(NAME_CHARS, { yPercent: 0, duration: 0.8, stagger: 0.02 })
    .to({}, { duration: 5.0 });
  ```
  Hapus `idleKiller` + referensinya di cleanup. Perbarui komentar blok
  (hapus "kill 5 dtk / potong mid-putaran"; tulis siklus roll→hening→ulang).

- [x] **Step 2: Verifikasi tsc + oxlint + build**
  Hasil 2026-11-16: tsc 0, oxlint 0, build ✓ 260ms.

  Run: `npx tsc --noEmit; npx oxlint src; npm run build` dari `D:\CodeProject\Portofolio`
  Expected: tsc exit 0, oxlint exit 0, `built in` tanpa error.

- [x] **Step 3: Probe denyut + exit**
  Hasil 2026-11-16 (sampling 1 dtk ×16): T3-4 moving=10 (roll siklus 1), T5-9 moving=0 (hening), T10-12 moving=10 (roll siklus 2 — bukti tak mati), T13+ hening lagi. EXIT y=200 heroOp=0 live=true. PASS, tanpa PAGEERROR. (Catatan: probe pertama T13 jatuh di hening siklus 2 — timing, bukan bug; sampling rapat memastikannya.)

  Dev server + puppeteer `vprobe.cjs` sementara (hapus setelahnya):
  - t≈3 dtk: moving>0 (roll siklus 1 jalan).
  - t≈6-9 dtk: moving=0 (hening — teks penuh di tempat).
  - t≈12 dtk: moving>0 (roll siklus 2 = bukti tak mati permanen).
  - Scroll 200px: exit PASS (heroOp=0, about-live=true).
  Expected: keempat kondisi PASS, tanpa PAGEERROR.

---

## Self-Review

1. Spec coverage: denyut (roll 2 + hening 5 + ulang) → Step 1; stagger renggang/rapat → Step 1; tanpa killer → Step 1; RM/mask/constraints → Global Constraints; anti-tabrakan → Review Focus + probe Step 3.
2. Step scan: tiap step satu aksi + hasil checkable; satu task (~15 baris, 1 file).
3. Type consistency: API GSAP existing; tak ada tipe baru.
4. Review Focus: 5 risiko + ekspektasi; kunci (ekor stagger, hening, drift repeat, scroll, cleanup) tercakup.
5. Proportion: plan ~45 baris untuk spec ~70 baris — ringkas.
