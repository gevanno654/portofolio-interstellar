# Overlap Hero→About ala Moncy — Design

## Intent & Why
- Zona mati terukur (probe 2026-11-16): hero opacity ~0 di y=400, kata about
  baru bergerak y=600 — y=400–600 tanpa teks, hanya slot melayang.
- Moncy menumpuk section berikut di atas hero (tl1 .landing-container):
  konten berikut sudah menunggu saat hero memudar = dissolve menyatu.

## Goals
1. About menumpuk hero (margin negatif + pin), dissolve menyatu tanpa zona mati.
2. Travel slot kanan→kiri tetap (ukuran tetap 90vw, mirror +15°→−15° tetap).
3. Word-rise + headline time-based about tetap; teks putih tetap terbaca.
4. Scroll balik reversibel penuh.

## Non-goals
- Smooth 1.7; besaran exit hero (+40%/fade); copy; Taurus; mobile/RM natural.

## Anti-goals
- Tahan-lempar (rasio gerak:scroll >2:1 dilarang — trauma teleport 8.4:1);
  dua penulis satu properti; ubah ukuran slot.

## Constraints
- Satu viewport pin (100svh), semua tween 1:1 di dalamnya, scrub 0.6.
- Folder bukan git; komentar Indonesia; tsc 0, oxlint 0, build + probe/100px.

## Approaches
- **A. Pin + overlap (DIPILIH)**: pin hero 1 viewport (pinSpacing true);
  about margin-top -100svh menumpuk; counter about +100svh→0 sepanjang pin
  (visual diam = slide moncy); hero exit + travel + word-rise scrub sama.
- **B. Overlap tanpa pin** — DITOLAK: tumpukan bergeser sebelum dissolve = ghosting.
- **C. Majukan trigger natural** — DITOLAK: hanya menyusutkan zona mati.

## Desain (final)
1. **Hero.tsx**: master exit + `pin: true, pinSpacing: true, end: "+=100%"`.
   Exit tetap (yPercent 40 + fade), dalam rentang pin.
2. **About.css**: `.about { margin-top: -100svh }` (desktop non-RM);
   counter via tween (bukan CSS): about y +100svh→0 scrub sama.
3. **About.tsx**: word-rise trigger diganti progress pin (atau trigger
   about dengan start/end dipetakan ke rentang pin); headline time-based tetap.
4. **Cosmos.tsx**: travel trigger dipetakan ke rentang pin yang sama.
5. **BlackHoleScene**: fade berbasis rect about tetap (about menumpuk =
   rect selalu terlihat selama pin — kurva disesuaikan bila perlu).
6. **Probe**: tiap 100px y=0–900+: rasio gerak:scroll ≤2:1 di semua titik;
   headline/kata parkir benar; BACK ke hero persis; mobile/RM tanpa pin.

## Builder check
- LOAD hero penuh; MID dissolve (hero samar + about terbaca, tanpa zona kosong);
  FULL about penuh + slot kiri; BACK l=461 w=1296; ERRS=0; screenshot tiap tahap.
