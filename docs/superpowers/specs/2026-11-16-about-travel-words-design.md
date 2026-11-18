# About: Teks Lebih Besar + Word-Rise + Travel Bawah→Tengah — Design

## Intent & Why
- Bio ("I am a...") + sinyal terlalu kecil → halaman about terasa kosong.
- Entrance bio/sinyal level blok (fade + 28px) terasa datar; headline sudah
  char-level. Minta: entrance per KATA naik dari mask (Split Text ala moncy).
- Minta: elemen about bergerak dari bawah halaman ke tengah (travel moncy),
  bukan materialisasi di tempat.

## Goals
1. Bio + sinyal diperbesar secukupnya (mengisi halaman, tidak mendominasi).
2. Entrance bio + sinyal: rise PER KATA dari mask (bukan karakter).
3. Desktop: box about travel dari bawah viewport ke tengah (0.75→1 master).
4. Mobile: word-rise + rise kontainer moderat (tanpa pin).
5. Headline, idle ular, Taurus, RM/no-JS fallback tak berubah perilaku.

## Non-goals
- Headline tetap char intro + idle (tak diubah).
- Rentang master tetap 200px (HERO_MASTER_PX tak tersentuh).
- Tanpa plugin SplitText GSAP — splitter kata hand-rolled (konsisten Chars).

## Anti-goals
- Travel yang judder/overshoot; tabrakan penulis properti (jitter).

## Constraints
- Kepemilikan terpisah: master = box y + kontainer opacity; word-rise =
  `.word` yPercent; intro/idle = `.char`. Tak ada properti ganda.
- Folder bukan git (rollback manual); komentar Indonesia; tsc 0, oxlint 0,
  build lulus + probe puppeteer + screenshot.

## Approaches
- **A. Inner travel** (kontainer naik, box slideshow tetap) — aman tapi bukan
  "dari bawah halaman"; DITOLAK user.
- **B. True travel (DIPILIH user)**: buang counter -200→0; box di-hold di
  bawah viewport (y0 = innerHeight-50 via function value +
  invalidateOnRefresh) selama 0→0.75, lalu travel y0→0 di 0.75→1. Scrub 0.6
  sama; mendarat top=0 = about mengisi viewport (tengah via flex).
- **C. Word-rise saja** — tanpa travel; DITOLAK user (bukan yang diminta).

## Desain (final)
1. **Ukuran**: token baru `--step-about-bio: clamp(1.25rem, 2.2vw, 1.75rem)`
   (bio, max-width 38→44ch); `--step-about-signal:
   clamp(0.95rem, 1.4vw, 1.15rem)` (sinyal, mono/spacing tetap).
2. **Words splitter** (`About.tsx`): pecah spasi → tiap kata
   `<span class="wmask"><span class="word">` + spasi antar mask;
   CSS `.wmask` inline-block overflow-hidden, `.word` inline-block
   will-change. Tag sinyal tetap statis (ikut fade kontainer).
3. **Master desktop** (`Hero.tsx`): hapus counter aboutEl; ganti
   `set y=y0` di 0 + `to y=0` di 0.75 (dur 0.25, ease none).
   `aboutReveals` jadi opacity-only (y:28 dicabut — gerak dimiliki kata);
   tambah rise `.about-text .word` yPercent 110→0 stagger di 0.75.
   Headline fade + Taurus tak berubah.
4. **Roll gate desktop**: trigger viewport lama mati (geometri dokumen ≠
   visual saat hold). Ganti ScrollTrigger `{trigger:"#top", start:"top
   top", end:"+="+HERO_MASTER_PX}` toggle play/pause + syarat introDone.
   Mobile: trigger viewport lama dipertahankan.
5. **Mobile** (`About.tsx` tl): kontainer opacity + rise +12vh→0;
   `.word` rise 110→0 stagger, trigger sama (top 88%→45%, scrub 0.6).
6. **Intro headline**: tak diubah (jendela trigger kini nyata di desktop
   karena box di bawah viewport — bonus: gate introDone jadi bermakna).

## Builder check
- y0 function value + `invalidateOnRefresh: true` (resize aman).
- Probe: LOAD about top ≥ vh; FULL top=0 + word count + rise terkomputasi;
  scroll-back stabil; screenshot load/mid/full + mobile.
