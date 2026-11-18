# About Travel + Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bio + sinyal diperbesar, entrance per kata dari mask, box about travel dari bawah viewport ke tengah di desktop.

**Architecture:** `About.tsx`: splitter `Words` (mask+word per kata) dipakai bio + body quote; `About.css`: token ukuran + mask; `Hero.tsx`: counter -200→0 dibuang, diganti hold y0 + travel + word-rise; gate roll diganti ScrollTrigger hero. Mobile: kontainer + word-rise.

**Tech Stack:** React 19, GSAP 3.15, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-16-about-travel-words-design.md`

## Global Constraints

- Rentang master tetap 200px (HERO_MASTER_PX tak tersentuh); scrub 0.6 sama.
- Headline intro+idle+fade, Taurus, RM early-return tak berubah perilaku.
- Kepemilikan terpisah: master = box y + h2/kontainer opacity + `.word` yPercent; word-rise = `.word`; char intro/idle = `.char`. Satu properti satu penulis.
- Kelas `.reveal` dipertahankan pada bio/sinyal (kontrak global.css + query master); gerak y:28 dicabut dari reveal tentang, diganti kata.
- Komentar Indonesia; tsc 0, oxlint 0, build lulus; probe puppeteer + screenshot tiap task; file sementara dihapus; folder bukan git.

## Review Focus

- Hold y0 salah (about bocor/terlalu jauh) — ekspektasi: LOAD top >= innerHeight-60, FULL top = 0.
- Word-rise + kontainer opacity double-fade — ekspektasi: kata muncul dari mask, bukan seluruh blok memudar dulu.
- Gate roll baru play sebelum introDone (desktop) — ekspektasi: latch introDone tetap dijaga.
- Resize mengubah y0 — ekspektasi: invalidateOnRefresh menghitung ulang, posisi mendarat tetap top=0.
- Mobile: word-rise tak jalan / intro headline pecah — ekspektasi: kata naik per kata, char headline utuh.

---

### Task 1: Splitter kata + ukuran + mask CSS

**Files:**
- Modify: `src/styles/tokens.css` (~baris 30-35)
- Modify: `src/components/About.tsx` (~baris 9-21, 148-153)
- Modify: `src/components/About.css` (`.about-sub`, `.about-signal`, tambah `.wmask/.word`)

**Interfaces:**
- Consumes: `about.subtitle/quote` dari content; token `--step-lede/micro`.
- Produces: `Words({text}:{text:string})` → `.about-text .wmask > .word` + spasi; token `--step-about-bio/signal`; `.word` state awal yPercent 0 (GSAP yang menganimasikan, bukan CSS).

- [ ] **Step 1: Tulis token ukuran bio + sinyal di `tokens.css`**

`--step-about-bio: clamp(1.25rem, 2.2vw, 1.75rem);` setelah `--step-lede`; `--step-about-signal: clamp(0.95rem, 1.4vw, 1.15rem);` setelah `--step-micro`. Komentar: bio mengisi halaman, sinyal tetap mono kecil tapi terbaca.

- [ ] **Step 2: Tulis fungsi `Words` di `About.tsx` (di bawah `Chars`)**

Signature `Words({ text }: { text: string })`. Tiap kata: `<span className="wmask" aria-hidden="true"><span className="word">{kata}</span></span>` + spasi string antar mask (bukan nbsp — bungkus baris natural). JSDoc satu baris: pecah per kata agar rise bermasker; label utuh di aria-label orangtua.

- [ ] **Step 3: Pakai `Words` di JSX bio + body quote**

Bio: `<p className="lede about-sub reveal" aria-label={about.subtitle}><Words text={about.subtitle} /></p>`. Quote: struktur tag + `<br/>` tetap, body quote jadi `<span aria-label={about.quote}><Words text={about.quote} /></span>`. Headline `Chars` tak tersentuh.

- [ ] **Step 4: Tulis CSS ukuran + mask di `About.css`**

`.about-sub { font-size: var(--step-about-bio); max-width: 44ch; }`. `.about-signal { font-size: var(--step-about-signal); }` (sisa tetap). Tambah: `.about-text .wmask { display:inline-block; overflow:hidden; vertical-align:top; padding-bottom:0.12em; margin-bottom:-0.12em; }` + `.about-text .word { display:inline-block; will-change:transform; }`. Komentar: mask descender per kata (salin pola `.line`).

- [ ] **Step 5: Verifikasi tsc + oxlint + build**

Run dari `D:\CodeProject\Portofolio`: `npx tsc --noEmit; npx oxlint src; npm run build`
Expected: tsc 0, oxlint 0, `built in` tanpa error.

- [ ] **Step 6: Probe DOM kata + screenshot**

Dev server + puppeteer sementara (hapus setelahnya): hitung `.about-text .word` (>0, = jumlah kata bio+quote), cek tiap `.word` punya parent `.wmask`, screenshot about. Expected: PASS tanpa PAGEERROR.

---

### Task 2: Master desktop — hold + travel + word-rise + gate roll

**Files:**
- Modify: `src/components/Hero.tsx` (~baris 129-183)
- Modify: `src/components/About.tsx` (~baris 55-96: gate roll)

**Interfaces:**
- Consumes: `.about-text .word` dari Task 1; `MASTER_PX`, scrub 0.6, pin, about-live existing; flag `introDone` + `tryPlay` existing.
- Produces: hold y0 (function value, invalidateOnRefresh) + travel 0.75→1; word-rise; gate roll ScrollTrigger `#top`.

- [x] **Step 1: Ganti counter about dengan hold + travel di `Hero.tsx`**
  Hasil 2026-11-16: hold `gsap.set y: innerHeight-50` + `exit.to y:0` 0.75 + invalidateOnRefresh; probe LOAD top=1050, MID top=421, FULL/BACK benar.
- [x] **Step 2: Ubah `aboutReveals` jadi opacity-only + tambah word-rise**
  Hasil 2026-11-16: y:28 dicabut; word-rise 110→0 stagger 0.004 di 0.75; probe 25/25 kata naik bertahap dari mask.
- [x] **Step 3: Ganti trigger pause roll desktop dengan ScrollTrigger hero**
  Hasil 2026-11-16: desktop `#top +=HERO_MASTER_PX`, mobile scope lama; latch introDone tak tersentuh.
- [x] **Step 4: Verifikasi tsc + oxlint + build**
  Hasil 2026-11-16: tsc 0, oxlint 0, build ✓.
- [x] **Step 5: Probe travel + kata + screenshot**
  Hasil 2026-11-16: LOAD/MID/FULL/BACK PASS tanpa PAGEERROR; shot-mid/about disimpan untuk review user.
  Fix reviewer final (Important, resize): exit.set/gsap.set/CSS transform SEMUA basi via probe; fix = fromTo + onRefresh handler (set y kini bila progress<0.75 + exit.invalidate). Pelajaran: visual top = box200 + y — ekspektasi probe harus memasukkan offset dokumen (salah ekspektasi sempat mengaburkan fix yang sudah bekerja). Probe final: H900=1050, H700=850 (hold ikut vh), FULL=0.

---

### Task 3: Mobile — rise kontainer + word-rise

**Files:**
- Modify: `src/components/About.tsx` (~baris 107-122: tl mobile)

**Interfaces:**
- Consumes: `.about .reveal` + `.about-text .word` existing; trigger mobile existing (top 88%→45%, scrub 0.6).
- Produces: tl mobile opacity + rise kontainer moderat + word-rise.

- [x] **Step 1: Tambah rise kontainer + kata di tl mobile**
  Hasil 2026-11-16: reveal y 28→12vh + word-rise 110→0 stagger 0.008 posisi "<".
  Ruling: trigger section (88%→45%, lalu 20%) selesai sebelum kata masuk viewport → trigger milik `.about-text` (top 95%→45%). Probe: Y700 20/20 kata naik bertahap, Y1000 parkir 0; screenshot tangkap rise tengah jalan (mask potong kata — benar).

- [x] **Step 2: Verifikasi tsc + oxlint + build**
  Hasil 2026-11-16: tsc 0, oxlint 0, build ✓.

- [x] **Step 3: Probe mobile + screenshot**
  Hasil 2026-11-16: Y700 20/20 moving, Y1000 parkir, ERRS=0; shot-mob-mid/mob disimpan untuk review user.

---

## Self-Review

1. Spec coverage: ukuran (T1S1+S4), splitter+mask (T1S2-S4+S6), hold+travel (T2S1+S5), word-rise desktop (T2S2+S5), gate roll (T2S3+S5), mobile (T3S1+S3). Headline/Taurus/RM tak diubah — sesuai non-goals.
2. Step scan: tiap step satu aksi + hasil checkable; tanpa "TBD". Task 2 tanpa JS-test unit (animasi — verifikasi probe terkomputasi T2S5).
3. Type consistency: `Words({text}:{text:string})` vs `Chars` existing; `.wmask/.word` dipakai T1S4→T2S2/T3S1 konsisten; `HERO_MASTER_PX` impor path sama seperti Hero.
4. Review Focus: 5 risiko + ekspektasi + test di owning task (hold→T2S5, double-fade→T2S5, gate→T2S3+S5, resize→T2S1 invalidate + T2S5, mobile→T3S3).
5. Proportion: plan ~110 baris untuk spec ~60 baris — proporsional, tanpa transcript body (signature + nilai spec saja).
