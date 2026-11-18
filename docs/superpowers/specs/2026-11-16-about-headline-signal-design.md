# Design: About — Posisi, Quotes Sinyal, Headline Gradasi + Idle

Tanggal: 2026-11-16
Pendekatan quotes: A — Koordinat sinyal (dipilih user)

## 1. Intent & Why

Teks About sudah rata kanan tapi menempel tepi (kolom 7/13). Quotes
dengan border-aksen terlihat seperti tempelan AI. Headline polos,
sementara hero punya bahasa gerak teks (gradasi + idle ular) — About
terasa bahasa lain.

## 2. Goals / Non-goals / Anti-goals

Goals:
- Posisi: kolom `5 / 13` (tetap kanan, tidak menempel tepi), text-align kanan.
- Quotes A: log transmisi mono, tanpa tanda kutip:
  `▸ SIGNAL // 0047` + teks quotes. Selaras nav "01 SIGNAL".
- Headline "About Me.": gradasi cincin per-huruf persis YOH
  (linear-gradient 180deg, background-clip:text per .char),
  + mask `.line` overflow:hidden + Chars() per huruf,
  + idle ular PERSIS hero (paket mandiri 0.35, stagger 0.09,
  hening 7.5, repeat:-1, delay setelah reveal, pause viewport).
- Intro headline: naik per-huruf dari mask (seperti intro hero).

Non-goals:
- Bio tak berubah. Taurus tak berubah. Tag tetap hilang.

Anti-goals:
- Quotes terlihat tempelan AI (border/italic generik).
- Idle headline berebut dengan reveal `.about .reveal` atau master Hero.
- Gradasi pecah saat huruf bergerak (wajib per-.char seperti YOH).

## 3. Constraints

- Idle hero: 10 huruf, stagger 0.09 → lebar gelombang ~0.8 dtk.
  Headline "About Me." = 9 glyph (termasuk titik; spasi = nbsp tak
  beranimasi tapi ikut selektor). Gelombang lebih pendek — diterima,
  aturan identik.
- Kepemilikan: idle menulis `.about-headline .char`; reveal/master
  menulis container (`.about .reveal` / `.hero-content`) — tak berebut.
  Syarat: headline JANGAN ikut `.reveal` opacity (keluarkan dari
  selektor reveal mobile; desktop dimiliki master — headline about
  TIDAK ikut master Hero, jadi intro sendiri aman).
- Delay idle: setelah intro headline selesai (intro ~1 dtk → delay 1.5).
- RM: tak ada idle/intro (early return existing).
- Titik "." ikut gradasi (bagian dari Chars).
- Folder bukan git. Komentar Indonesia.

## 4. Approaches

- Quotes: B (kata raksasa) ditolak — bersaing dengan headline;
  C (stempel miring) ditolak — berlawanan kerapian situs.
  A dipilih: satu bahasa dengan nav/tag mono situs.
- Idle: duplikasi mesin hero (bukan ekstraksi util) — 2 pemakaian,
  ekstraksi premature. Builder tulis ulang pola yang sama di About.

## 5. Desain implementasi (untuk builder)

- `About.tsx`: headline → struktur mask + Chars lokal:
  ```tsx
  <h2 className="display about-headline">
    <span className="line"><span className="line-inner">
      <Chars text="About Me." />
    </span></span>
  </h2>
  ```
  Chars lokal (salin pola Hero.tsx) atau impor bila diekspor.
  Quotes → `<p className="about-signal reveal">▸ SIGNAL // 0047<br/>{about.quote}</p>`
  (tanpa blockquote, tanpa tanda kutip).
- `About.css`:
  - `.about-text { grid-column: 5 / 13; }` (tetap text-align:right).
  - Hapus aturan `.about-quote` lama → `.about-signal` mono kecil:
    `font-family:var(--font-mono); font-size:var(--step-micro);
    letter-spacing:0.08em; line-height:1.8; color:var(--ink-dim);`
    baris pertama `color:var(--warm-starlight)`.
  - Headline: `.about-headline .line {display:block; overflow:hidden;
    padding-bottom:0.08em; margin-bottom:-0.08em}` (mask descender),
    `.about-headline .char {display:inline-block; will-change:transform;
    background:linear-gradient(180deg, var(--grad-hero-light) 0%,
    var(--grad-hero-gold) 100%); -webkit-background-clip:text;
    background-clip:text; color:transparent;
    -webkit-text-fill-color:transparent}` + @supports fallback
    `color:var(--warm-starlight)` (salin pola YOH Hero.css:162-168).
  - Rata kanan: `.line-inner` + `.char` tetap inline-block — text-align
    kanan dari `.about-text` menurun normal.
- `About.tsx` gsap: intro `.about-headline .char` from yPercent:115
  (mobile: dalam tl reveal; desktop: trigger sendiri
  `top 88%→top 45%` seperti pola mobile existing — headline TIDAK ikut
  master Hero). Lalu idle: 8-9 timeline kecil stagger 0.09 + hening 7.5
  + ScrollTrigger pause viewport (salin pola Hero.tsx:61-80).
  Headline dikeluarkan dari `.reveal` (hapus kelas reveal di h2 +
  dari selektor `".about .reveal"` bila perlu — bio/quotes tetap reveal).
- Verifikasi: tsc 0, oxlint 0, build + probe (gradasi tampil,
  idle denyut, exit about tak rusak).

## 6. Diserahkan ke builder

- Nomor sinyal (`0047` atau lain) — tuning rasa.
- Delay idle pasti setelah intro headline (ukur durasi intro aktual).
