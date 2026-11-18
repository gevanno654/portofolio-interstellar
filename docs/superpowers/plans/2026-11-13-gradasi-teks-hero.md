# Gradasi Teks Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teks hero bergradasi (YOH + sapaan + peran), GEVANNO tetap putih solid.

**Architecture:** Teknik `background-clip: text` per `.char` (bukan per kata) agar gradasi vertikal konsisten di tiap huruf dan tidak pecah saat animasi per-karakter `yPercent: 115`. Token warna baru di `tokens.css`.

**Tech Stack:** CSS (`background-clip: text`), GSAP intro per-karakter (tidak berubah).

**Spec:** Persetujuan user 2026-11-13 — GEVANNO putih solid; lainnya gradasi vertikal terang-atas → emas-bawah (cahaya cincin). Font tetap Fraunces + Space Grotesk.

## Global Constraints

- GEVANNO tidak berubah (putih solid `nebula-white`).
- Palet hanya dari token proyek: `#d9dce5` (nebula-white) → `#c4a477` (warm-starlight); tanpa warna baru.
- Animasi intro per-karakter (`yPercent: 115`, stagger) tidak berubah perilakunya.
- Reduced-motion tetap: tanpa animasi, teks tetap terbaca.
- Tanpa JS: konten tetap terlihat (gradasi CSS murni, bukan JS).

---

### Task 1: Token + gradasi YOH, sapaan, peran

**Files:**
- Modify: `src/styles/tokens.css` (tambah `--grad-hero-light`, `--grad-hero-gold`)
- Modify: `src/components/Hero.css` (aturan gradasi per `.char` YOH/sapaan/peran)

**Interfaces:**
- Consumes: `.char` inline-block per-karakter dari `Chars()` di `Hero.tsx` (tidak berubah); mask `.line` (tidak berubah).
- Produces: class gradasi `.grad-ring` dipakai `Hero.tsx` Task 2.

- [ ] **Step 1: Tambah token gradasi di `tokens.css`**

```css
--grad-hero-light: #eef0f6;
--grad-hero-gold: #c4a477;
```

- [ ] **Step 2: Terapkan gradasi per-huruf di `Hero.css`**

Aturan: `.hero-name .line-name-sub .char`, `.hero-name .line-hello .char`, `.hero-role .char` memakai `background: linear-gradient(180deg, var(--grad-hero-light), var(--grad-hero-gold))`, `background-clip: text`, `color: transparent`. GEVANNO (`.line-name-main .char`) tidak tersentuh.

- [ ] **Step 3: Verifikasi statis**

Run: `node C:\Users\Gevanno\.agents\skills\hallmark\scripts\sloplint.mjs src/components/Hero.css --genre atmospheric`
Expected: clean, 0 FAIL.

- [ ] **Step 4: Verifikasi build + visual**

Run: `npm run build` lalu capture desktop 1440x900.
Expected: build lulus; YOH/sapaan/peran bergradasi terang→emas, GEVANNO putih solid, tidak menumpuk dengan lubang.

---

## Self-Review

1. Spec coverage: gradasi YOH/sapaan/peran → Task 1 Step 2; GEVANNO putih → tidak tersentuh; font tetap → tidak ada task ganti font (sesuai desain).
2. Step scan: tiap step satu aksi dengan hasil terukur.
3. Type consistency: tidak ada fungsi baru; hanya CSS + token.
4. Review Focus: background-clip tanpa prefix di Firefox lama → tambah `-webkit-background-clip` + fallback `color` solid agar tetap terbaca.
5. Proportion: plan pendek, sesuai perubahan kecil.
