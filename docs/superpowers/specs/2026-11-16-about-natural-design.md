# About Natural-Flow Redesign — Design

## Intent & Why
- Keluhan: (1) transisi bio/quote "aneh" (ghosting blok+fade), (2) headline
  "About Me." mengikuti scroll, muncul tak pas, (3) travel teleport 17:1,
  tak smooth ala moncy.
- Akar terukur (probe diag 2026-11-16): pin+hold 0→150 lalu lempar 850px
  dalam 50px scroll; word-rise ease none + stagger 0.004 = mekanis;
  intro headline scrub + fade master = huruf membeku tengah jalan.

## Goals
1. About mengalir natural 1:1 ikut scroll fisik (Smoother yang menghaluskan).
2. Bio/quote: entrance SATU lapis — rise per kata bermasker (tanpa fade blok).
3. Headline: intro time-based sekali main (bukan scrub), lalu idle ular.
4. Taurus merangkai saat terlihat (trigger viewport, bukan master).
5. Scroll agak panjang tetap mendarat pas (progress akhir = state akhir penuh).

## Non-goals
- Hero intro/exit (tak berubah); idle ular headline (tak berubah, hanya gate-nya);
  RM/no-JS fallback (tak berubah); mobile flow (sudah natural — trigger disamakan).

## Anti-goals
- Hold/lempar (rasio >2:1 dilarang); dua penulis satu properti; scrub untuk
  intro yang harus sekali-main.

## Constraints
- Smoother tetap (smooth 1.7); HERO_MASTER_PX dihapus dari rantai about
  (tetap dipakai hero exit + scrollTo + blackhole bila ada).
- Satu properti satu penulis: box y = scroll fisik (tanpa tween);
  `.word` = rise viewport; `.char` = intro+idle; opacity kontainer = tak ada.
- Folder bukan git; komentar Indonesia; tsc 0, oxlint 0, build + probe + screenshot.

## Approaches
- **A. Alir natural (DIPILIH)**: cabut pin, hold, counter, travel, fade
  master tentang about; margin overlap dicabut (about di bawah hero normal);
  hero exit tetap (fade+tenggelam, tanpa pin? — pin hero dicabut juga karena
  pin menahan scroll; hero keluar natural ke atas). Word-rise + Taurus +
  headline-fade trigger viewport sendiri-sendiri. Smoother menghaluskan semua.
- **B. Jendela panjang** (master 200→900px): pin 900px menahan lama, bleed
  edge, tetap arsitektur tahan-lempar — DITOLAK (tak menyelesaikan akar).

## Desain (final)
1. **Hero.tsx**: hapus pin, hold/travel/aboutWords/aboutReveals/headline
   fade/onRefresh dari master; master = hero exit saja (tanpa pin,
   end tetap 200px? — tanpa pin, end 200px = hero keluar dalam 200px scroll,
   terlalu cepat; end jadi "bottom top" natural). Taurus/rasi/links keluar
   dari master → pindah ke AboutTopography trigger sendiri (sudah ada? cek —
   bila belum, buat: trigger figure, start top 80% end top 45%, scrub 0.6).
2. **About.css**: cabut margin overlap (-100svh+200) + justify-center tetap;
   `.js .about-headline{opacity:0}` dicabut (headline time-based atur sendiri);
   `.js .reveal` global tetap (kontainer mulai 0 — tapi tanpa fade master,
   siapa menganimasikan? → tl viewport about, lihat 4).
3. **About.tsx desktop**: tl viewport sendiri (trigger scope, top 85%→top 40%,
   scrub 0.6): headline fade h2 0→1 + bio/quote rise KATA (yPercent 110→0,
   ease power2.out, stagger 0.02 — gelombang lembut, bukan 0.004 mekanis)
   + kontainer TANPA opacity tween (kata cukup; opacity blok = ghosting).
   Headline char intro: time-based (gsap.from, play saat tl progress>0.05
   sekali via onUpdate flag), lalu gate introDone → roll (latch tetap).
   Gate roll desktop: kembali trigger viewport scope (geometri jujur lagi).
4. **Mobile**: samakan pola desktop (trigger .about-text sudah benar;
   naikkan stagger 0.008→0.02 + ease power2.out).
5. **scrollTo(#about)** (useScrollSmoother): tetap ujung natural (posisi
   dokumen about — hitung ulang otomatis, tanpa MASTER_PX).

## Builder check
- Probe: LOAD hero penuh/about di bawah fold; scroll 600 (hero keluar
  natural, about naik 1:1 — top turun ≈ scroll); FULL kata parkir 0,
  headOp=1; scroll panjang (smoothTo bawah lalu balik) mendarat pas.
- Screenshot load/mid/full + mobile.
