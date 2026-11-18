# Blackhole Travel — Design

## Intent & Why
- Konsep user (dipilih: pendekatan A slot-travel): blackhole hero tidak
  hilang saat scroll, melainkan bergeser kanan→kiri mengiringi teks about
  ("I am...", quotes). Rasi Taurus dicabut dari about, pindah section lain.
- Ini parallax yang benar: satu objek latar melintasi viewport dengan
  kecepatan berbeda dari teks = kedalaman.

## Goals
1. Scroll hero→about: lubang menyusut + travel kanan→kiri, mendarat di
   kiri about (kolom kini kosong pasca-Taurus).
2. Lubang bertahan sepanjang about, baru luruh setelah about lewat.
3. Teks about tetap seperti sekarang (rise kata, headline time-based).
4. Fallback no-WebGL/RM (OrbitalSigil, canvas 2D dalam slot yang sama)
   ikut pola travel yang sama — gerak milik slot DOM, bukan shader.

## Non-goals
- Smooth 1.7 tetap (tak diubah); Taurus di section lain (tugas terpisah);
  mobile (slot tetap di zona langit atas, tanpa travel);
  pointer-parallax/tilt yang sudah ada (tak berubah).

## Anti-goals
- Dua lubang tampil bersamaan (crossfade) — satu objek, satu perjalanan.
- Mengubah shader (uDolly/uZoom tetap 0); travel murni posisi slot DOM.

## Constraints
- Lubang dirender canvas fixed global; posisi diukur tiap frame dari
  `.hero-slot-global` (getBoundingClientRect) — slot digeser via CSS,
  shader ikut otomatis tanpa perubahan TS.
- Kepemilikan: posisi+skala slot = tween ScrollTrigger scrub (desktop,
  non-RM); opacity lubang = mix shader existing (ditulis ulang kurvanya).
- Folder bukan git; komentar Indonesia; tsc 0, oxlint 0, build + probe.

## Approaches
- **A. Slot-travel (DIPILIH)**: tween scrub pada `.hero-slot-global`:
  state hero (90vw, right -22vw, top 52%) → state about (mis. 38vw,
  left ~4vw, top ~50% area about). Trigger: top-top → about bottom-top
  (sepanjang about terlihat). Fade mix ditulis ulang: penuh di hero,
  bertahan ~penuh sepanjang about, luruh cepat setelah about lewat.
  Taurus + figure dicabut dari About (kolom kiri kosong untuk lubang).
- **B. Crossfade dua slot** — DITOLAK: dua objek ≠ satu perjalanan.
- **C. Parallax DOM saja** — DITOLAK: tak memenuhi konsep user.

## Desain (final)
1. **About.tsx**: hapus `<AboutTopography/>` dari grid (kolom kiri kosong
   = panggung lubang); hapus impor. Grid kolom teks tetap 5/13 kanan.
2. **Hero.css** (desktop): tambah state akhir slot via CSS var yang
   di-tween GSAP — posisi: dari `right:-22vw;top:52%` ke
   `left:2vw;top:(posisi about)`... masalah: slot FIXED (viewport-space),
   about di document-space. Solusi jujur: slot fixed = posisi dalam
   viewport; tween: right -22vw→auto/left, top 52%→50%, width 90vw→38vw.
   Hasil: lubang tetap di kiri viewport sepanjang about (parallax:
   teks scroll lewat, lubang "menetap" kiri = kecepatan beda).
3. **Tween travel (Cosmos.tsx atau Hero.tsx)**: ScrollTrigger scrub
   trigger body/hero: start "top top", end "bottom bottom"... rentang
   tepat: mulai saat about masuk (hero bottom lewat), selesai saat about
   tengah. Nilai di-tuning via probe screenshot.
4. **BlackHoleScene.ts fade**: kurva mix ditulis ulang — sumbu bukan
   lagi scrollY/200 (master dihapus) melainkan progress about di viewport:
   terima via setHoleVis dari Cosmos ScrollTrigger (progress about),
   atau hitung dari rect about. Sederhana: Cosmos onUpdate hitung
   aboutVis (0 sebelum masuk, 1 sepanjang about, →0 setelah lewat).
5. **Mobile**: travel mati (slot zona langit, media query existing);
   fade existing dipertahankan.
6. **RM**: slot statis hero (tanpa tween), OrbitalSigil statis — existing.

## Builder check
- Probe: LOAD lubang kanan penuh; MID (about masuk) lubang kiri
  viewport + teks rise; FULL about lubang kiri penuh + Taurus tak ada;
  scroll lewat about lubang luruh; ERRS=0.
- Screenshot tiap tahap + mobile + tsc/oxlint/build.
