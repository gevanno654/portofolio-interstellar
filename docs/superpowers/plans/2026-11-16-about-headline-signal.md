# About Headline + Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Headline "About Me." gradasi + intro + idle ular persis hero, teks geser tengah-kanan, quotes jadi log sinyal.

**Architecture:** `About.tsx`: headline jadi mask+Chars, quotes jadi `.about-signal`; `About.css`: kolom 5/13, gradasi per-.char, style sinyal; gsap di `useGsapScope` About: intro char + roll ular + hening + pause (salin mesin Hero), headline keluar dari `.reveal`.

**Tech Stack:** React 19, GSAP 3.15, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-11-16-about-headline-signal-design.md`

## Global Constraints

- Aturan idle PERSIS hero: paket mandiri 0.35, stagger 0.09, hening 7.5, repeat:-1, pause viewport, RM mati. Delay setelah intro headline (intro ~1 dtk → delay 1.5).
- Gradasi per-.char (bukan per kata) + @supports fallback — salin pola YOH (Hero.css:148-168).
- Headline KELUAR dari `.reveal`: h2 tanpa kelas reveal; selektor reveal master (`Hero.tsx:100` → `.about .reveal`) dan mobile (`About.tsx:31`) tak boleh menyentuh `.about-headline .char`.
- Taurus, bio, tag-hilang tak berubah. Folder bukan git. Komentar Indonesia.

## Review Focus

- Master Hero (`Hero.tsx:100` `.about .reveal`) ikut menganimasikan headline baru — ekspektasi: headline tidak ikut (keluar dari reveal, intro sendiri).
- Intro headline vs reveal bio/quotes (mobile tl + desktop master): headline muncul selaras, tak tertinggal/hilang.
- Idle mulai sebelum intro selesai (delay 1.5 vs durasi intro aktual) — ekspektasi: tak ada flicker huruf.
- Rata kanan + inline-block char: baris tetap rata kanan, gradasi tak pecah.
- Spasi/nnbsp "About Me.": spasi tak beranimasi tapi tak merusak stagger.

---

### Task 1: JSX + CSS (posisi, gradasi, sinyal)

**Files:**
- Modify: `src/components/About.tsx` (~baris 42-52)
- Modify: `src/components/About.css` (`.about-text`, `.about-headline`, `.about-quote`)
- Modify: `src/content.ts` (`about.quote` tetap; tambah `about.signalNo = "0047"` bila builder mau — opsional, boleh hardcode di JSX)

**Interfaces:**
- Consumes: `about.headline/subtitle/quote` dari content; `Chars` pola Hero (salin lokal bila tak diekspor).
- Produces: `.about-headline .line/.line-inner/.char` (target Task 2); `.about-signal` (styling final, tanpa JS).

- [x] **Step 1: Tulis JSX headline mask + Chars + sinyal**
  Hasil 2026-11-16: h2 mask+line-inner+Chars (tanpa reveal), quotes → `.about-signal` mono + tag `▸ SIGNAL // 0047`.

  `About.tsx`: h2 → `<h2 className="display about-headline"><span className="line"><span className="line-inner"><Chars text="About Me." /></span></span></h2>` (tanpa `reveal`). Chars: salin fungsi dari `Hero.tsx:11-21` (span.char + nbsp, aria-hidden). Quotes → `<p className="about-signal reveal"><span className="about-signal-tag">▸ SIGNAL // 0047</span><br/>{about.quote}</p>`.

- [x] **Step 2: Tulis CSS kolom + gradasi + sinyal**
  Hasil 2026-11-16: kolom 5/13, mask descender, gradasi per-char + fallback, `.about-signal` mono; fix susulan: `margin auto + text-align:right` agar sejajar kanan bio.

  `About.css`: `.about-text { grid-column: 5 / 13; }` (text-align:right tetap). Tambah mask `.about-headline .line` (display:block, overflow:hidden, padding/margin descender 0.08em — salin Hero.css:114-120), `.char` (inline-block, will-change, gradasi `linear-gradient(180deg, var(--grad-hero-light), var(--grad-hero-gold))` + background-clip:text + transparent + @supports fallback `color:var(--warm-starlight)` — salin Hero.css:152-168). Hapus blok `.about-quote` lama → `.about-signal` (`font-mono`, micro, spacing 0.08em, line-height 1.8, ink-dim) + `.about-signal-tag` (warm-starlight).

- [x] **Step 3: Verifikasi tsc + oxlint + build**
  Hasil 2026-11-16: tsc 0, oxlint 0, build ✓.

  Run dari `D:\CodeProject\Portofolio`: `npx tsc --noEmit; npx oxlint src; npm run build`
  Expected: tsc 0, oxlint 0, `built in` tanpa error.

---

### Task 2: Intro + idle ular headline

**Files:**
- Modify: `src/components/About.tsx` (useGsapScope ~baris 13-35)
- Modify: `src/lib/gsap.ts` bila `ScrollTrigger` belum diekspor (cek: Hero.tsx sudah impor `{ gsap, ScrollTrigger }` — pakai impor yang sama)

**Interfaces:**
- Consumes: `.about-headline .char` dari Task 1; `useGsapScope` cleanup; `scope` untuk trigger.
- Produces: intro + roll + pause; tanpa sisa killer/timer.

- [x] **Step 1: Tulis intro char + roll ular + hening + pause**
  Hasil 2026-11-16: intro from+scrub trigger sendiri, roll 9 timeline kecil 0.35/stagger 0.09 + hening 7.5 + pause viewport; cleanup kill+set; ScrollTrigger impor dipakai.
  Fix reviewer ronde-1 (Important): delay waktu → gate progress (paused:true + onUpdate progress>=1 → play + flag introDone guard onEnter). Fix temuan sendiri (Critical): TDZ ReferenceError onUpdate synchronous → urutan dibalik (roll dulu, baru intro).

  Di `useGsapScope` About (setelah `if (reduced || !scope) return;`): intro `gsap.from(".about-headline .char", { yPercent: 115, duration: 0.9, stagger: 0.035, ease: "power3.out", scrollTrigger: { trigger: scope, start: "top 88%", ... } })` — desktop: trigger sendiri (master Hero tak menyentuh headline); mobile: gabung pola reveal existing. Lalu roll: salin Hero.tsx:61-80 (10→9 timeline kecil, duration 0.35, stagger 0.09, hening 7.5, delay 1.5, ScrollTrigger pause viewport). Return cleanup `roll.kill() + set 0`.

- [x] **Step 2: Verifikasi tsc + oxlint + build**
  Hasil 2026-11-16: tsc 0, oxlint 0, build ✓ (fix impor ScrollTrigger dipakai Task 2).

  Run sama seperti Task 1 Step 3. Expected: tsc 0, oxlint 0, build lulus.

- [x] **Step 3: Probe gradasi + denyut + exit**
  Hasil 2026-11-16: chars=9, clip=text, kolom 5, align right, signal ada, headReveal=false; state roll iter 1→2→3 paused=false (repeat jalan — dugaan berhenti kemarin = sampling DOM terlalu jarang); screenshot PASS.
  Fix reviewer ronde-2 (Critical): headline tampil penuh sejak load menumpuk hero (keluar dari .reveal tapi tanpa state awal + trigger intro progress=1 sejak awal karena overlap) → fix: fade opacity-only h2 di master 0.75 + `.js .about-headline{opacity:0}` desktop. Probe: LOAD headOp=0, FULL headOp=1/subOp=1, screenshot load+about PASS.
  Fix reviewer final (Important, scroll-back dual-writer): dicoba gate dua arah lalu histeresis — keduanya SALAH diagnosis. State roll langsung (paused=false, iter 1→2, dur 8.92) membuktikan repeat sehat; `moves=1/25` adalah artefak sampling DOM (hening 7.5 dtk/siklus 8.92 dtk vs sampling 0.4 dtk). Gate kembali SATU ARAH (latch, tanpa cabang pause) — cabang pause mem-pause playhead saat settling scrub/smoother (1→0.999→1) dan memutus paket tengah jalan. Bukti state > bukti sampling DOM: jangan ulangi kesalahan ini.

  Dev server + puppeteer `vprobe.cjs` sementara (hapus setelahnya): scroll ke about (smoother scrollTo 200), sampling `transform` char pertama vs terakhir (bukti independensi seperti probe hero), cek `background-clip:text` terkomputasi, cek exit (scroll lanjut → about tetap tampil, tanpa stuck). Expected: PASS tanpa PAGEERROR.

---

## Self-Review

1. Spec coverage: posisi (T1S2), sinyal (T1S1+S2), gradasi (T1S2), mask+Chars (T1S1), intro+idle+pause (T2S1), RM (existing early return), verifikasi (T1S3, T2S2+S3). Nomor sinyal → Task 1 hardcode/opsional content.
2. Step scan: tiap step satu aksi + hasil checkable; tanpa "TBD". Task 1 tanpa JS-test (CSS/JSX — verifikasi build + screenshot probe T2S3).
3. Type consistency: `Chars({text}:{text:string})` salin Hero; `gsap.from/to/timeline`, `ScrollTrigger.create` — API existing.
4. Review Focus: 5 risiko + ekspektasi; master-vs-headline (kunci: keluar dari reveal) → T1S1+T2S1; flicker delay → T2S1+S3; rata kanan → T1S2+S3; nbsp → T1S1+S3.
5. Proportion: plan ~70 baris untuk spec ~80 baris — ringkas, tanpa transcript body (pola disalin via referensi baris, bukan ditempel penuh).
