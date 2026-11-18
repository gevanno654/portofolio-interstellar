# About Natural-Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** About mengalir natural 1:1, rise kata ber-ease, headline time-based — hapus pin/hold/travel/fade-master.

**Architecture:** Hero master = hero exit saja (tanpa pin/about); About.css overlap dicabut; About.tsx tl viewport desktop (headline fade + word-rise power2.out + intro time-based + latch roll); Taurus trigger sendiri; mobile disamakan.

**Tech Stack:** React 19, GSAP 3.15, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-16-about-natural-design.md`

## Global Constraints

- Satu properti satu penulis; tanpa pin/hold/travel/fade-master tentang; ease rise power2.out, stagger kata 0.02.
- Scrub 0.6 tetap untuk rise; intro headline time-based once.
- Folder bukan git; komentar Indonesia; tsc 0, oxlint 0, build + probe + screenshot tiap task; file sementara dihapus.

## Review Focus

- Hero tanpa pin bergeser saat scroll (konten di bawah ikut naik natural — ekspektasi: ya, itu alir natural; tak ada lompatan).
- scrollTo(#about) mendarat salah (posisi dokumen berubah — ekspektasi: hitung ulang otomatis Smoother).
- Headline time-based fire ganda (StrictMode — ekspektasi: flag once + cleanup).
- Taurus tak merangkai (trigger pindah — ekspektasi: rangkai saat terlihat).
- Roll tak jalan (gate latch — ekspektasi: play setelah intro time-based).

---

### Task 1: Bongkar master + overlap (alir natural)

**Files:**
- Modify: `src/components/Hero.tsx` (~baris 97-240)
- Modify: `src/components/About.css` (~baris 1-47)
- Modify: `src/hooks/useScrollSmoother.ts` (cek scrollTo about)

**Interfaces:**
- Consumes: MASTER_PX, scrub, pin, about queries existing.
- Produces: master = hero-exit-only tanpa pin; about di flow normal.

- [ ] **Step 1: RED — probe rasio travel saat ini (bukti sebelum)**

Puppeteer sementara: scrollTo(150) catat top about; hitung rasio Δtop/Δscroll. Expected: rasio >>2 (bukti teleport, mis. ~17:1).

- [ ] **Step 2: Hapus pin + about dari master Hero**

Hapus: pin/pinSpacing/anticipatePin, aboutEl hold/fromTo/onRefresh, aboutHeadline fade, aboutReveals fade, aboutWords rise, about-live toggle, rasi/links dari master (pindah Task 3). Master tersisa: hero-scroll + hero-content exit, trigger scope, start "top top", end "bottom top" (natural, tanpa pin), scrub 0.6. Komentar: master = hero exit saja; about mengatur dirinya sendiri (alir natural 1:1 via Smoother).

- [ ] **Step 3: Cabut margin overlap About.css + headline-hide**

Hapus `margin-top: calc(-100svh + 200px)` (about di flow normal bawah hero); hapus `.js .about-headline{opacity:0}` + media RM override-nya (headline diatur tl time-based); `justify-content:center` tetap; pointer-events/about-live dicabut (tak ada overlap lagi). Komentar disesuaikan.

- [ ] **Step 4: GREEN — probe alir natural + verifikasi**

tsc 0, oxlint 0, build ✓. Probe: LOAD (hero penuh, about top ≈ 900 = di bawah fold); scrollTo(400) (top turun ≈ 500 = rasio ~1:1, headOp bebas); FULL scroll bawah (about terlihat penuh). Expected: rasio 0.8–1.2. Screenshot load/mid.

### Task 2: Entrance desktop — kata ber-ease + headline time-based

**Files:**
- Modify: `src/components/About.tsx` (~baris 47-144)

**Interfaces:**
- Consumes: Words/Chars, roll, introDone/tryPlay existing.
- Produces: tl viewport desktop; intro time-based once; gate roll latch.

- [ ] **Step 1: RED — probe entrance ganda saat ini**

Probe: scrollTo(150) catat wordY + kontainer opacity (bukti ghosting: dua lapis berubah bareng).

- [ ] **Step 2: Tulis tl viewport desktop + intro time-based**

Ganti cabang `if (desktop) return cleanup` dengan tl: trigger scope, start "top 85%", end "top 40%", scrub 0.6: (a) `.about .reveal` TIDAK di-tween (kontainer tanpa opacity — hapus dari target; kata cukup); (b) `.about-text .word` yPercent 110→0 power2.out stagger 0.02; (c) headline h2 opacity 0→1 (ganti CSS-hide yang dicabut; via fromTo immediateRender true? — pakai gsap.set 0 di setup + to di tl). Intro char: time-based `gsap.from` (tanpa scrollTrigger; duration 0.9 stagger 0.035 power3.out, paused:true, play saat tl progress>0.05 sekali via onUpdate flag `introPlayed`). onUpdate tl: `if (progress>=1){introDone=true; roll.play();}` latch tetap. Gate roll desktop: trigger scope viewport (ganti #top). Komentar tiap kepemilikan.

- [ ] **Step 3: GREEN — probe rise + headline + verifikasi**

tsc 0, oxlint 0, build ✓. Probe desktop: scroll bertahap — kata naik BERGELOMBANG (stagger terlihat: sample kata awal < kata akhir), headline muncul sekali penuh lalu idle (bukan ikut scroll), roll repeat (state iter maju). Screenshot mid/full.

### Task 3: Taurus trigger sendiri + mobile + final

**Files:**
- Modify: `src/components/AboutTopography.tsx` (cek trigger existing; tambah bila belum)
- Modify: `src/components/About.tsx` (tl mobile: stagger+ease)
- Modify: `src/hooks/useScrollSmoother.ts` (bila scrollTo pakai MASTER_PX)

**Interfaces:**
- Consumes: rasi/links, tl mobile existing.
- Produces: Taurus viewport-trigger; mobile stagger 0.02 power2.out.

- [ ] **Step 1: Pindahkan Taurus ke trigger viewport sendiri**

Cek AboutTopography: bila sudah punya ScrollTrigger scrub sendiri (cx-cy perakitan), pertahankan + pastikan start/end viewport (top 85%→45%) — tak bergantung master. Bila ikut master, tulis trigger sendiri setara. Probe: scroll — rasi merangkai saat figure terlihat.

- [ ] **Step 2: Samakan mobile (stagger + ease)**

tl mobile: stagger 0.008→0.02, tambah ease power2.out pada word-rise. Trigger .about-text tetap. Probe mobile 390px: kata naik bergelombang, parkir 0, ERRS=0.

- [ ] **Step 3: Verifikasi akhir + screenshot**

tsc 0, oxlint 0, build ✓. Probe full desktop (load/mid/full/back) + mobile + scroll panjang (scrollTo bawah section lalu balik — mendarat pas, kata/headline stabil). Screenshot semua. Hapus file sementara.

---

## Self-Review

1. Spec coverage: alir natural (T1), rise ease (T2), headline time-based (T2), Taurus (T3), mendarat pas (T1S4+T3S3), RM (existing).
2. Step scan: tiap step satu aksi + Expected checkable.
3. Type consistency: selektor `.about-text .word`, HEAD_CHARS, HERO_MASTER_PX (Hero exit bila masih dipakai) konsisten.
4. Review Focus: 5 risiko + test di owning task.
5. Proportion: plan ~90 baris untuk spec ~50 — proporsional.
