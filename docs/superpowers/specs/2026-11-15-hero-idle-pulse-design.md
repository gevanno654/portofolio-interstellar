# Design: Hero Idle Roll Berdenyut (revisi)

Tanggal: 2026-11-15 (revisi dari design 2026-11-15-hero-idle-roll)
Pendekatan: A — GSAP roll per-karakter, berdenyut selamanya

## 1. Intent & Why

Desain lama (roll 5 dtk lalu mati permanen) terasa salah di tangan user:
ritme rapat (~1.7 dtk/putaran) + berhenti total setelah ~3 putaran =
hero mati. Maunya: idle berdenyut terus — roll jalan 2 dtk, hening 5 dtk,
roll jalan lagi, selamanya. Plus delay antar-huruf di awal roll agar
gelombang awal terlihat (stagger naik renggang, stagger masuk rapat).

## 2. Goals / Non-goals / Anti-goals

Goals:
- Siklus: roll 2.0 dtk (naik 0.8 + napas 0.4 + masuk 0.8) → hening 5.0 dtk
  → ulang selamanya (`repeat: -1` tanpa killer).
- Stagger naik 0.06 (gelombang renggang — awal vs akhir huruf terbaca),
  stagger masuk 0.02 (rapat — teks kembali kompak).
- Target tetap GEVANNO + YOH saja; kill permanen DICABUT.
- Tak berebut: idle di `.char` nama; exit di `.hero-content`.

Non-goals:
- Tidak menyentuh "Hello! I'm", role, scroll-hint, copy, warna, layout.

Anti-goals:
- Berhenti permanen (desain lama — justru keluhan user).
- Tabrakan intro (delay awal tetap ≥2.0) atau exit scroll.

## 3. Constraints

- Intro char terakhir selesai 1.815 → delay awal 2.0 (warisan fix reviewer).
- Mask `.line` overflow:hidden — tak perlu CSS baru.
- Struktur timeline: `.to(naik) → .to(napas) → .to(masuk) → .to(hening)`,
  `repeat: -1`. Napas = tween dummy `{}` 0.4 (teks kosong di luar mask).
- Hening 5.0 dtk = jeda antar siklus, BUKAN kematian (koreksi makna "5 detik").
- Angka ritme (0.8/0.4/0.8, stagger 0.06/0.02, hening 5.0) = tuning feel,
  gampang disetel bila user minta.
- RM: tidak ada idle. Mobile: roll tetap jalan (bounded per siklus).
- Folder bukan git: tanpa commit. Komentar Indonesia.

## 4. Approaches

- A. Timeline `repeat:-1` roll→hening (DIPILIH): satu timeline, hening =
  `.to({}, {duration:5})` di ujung. Stop bersih = kill timeline.
- B. Dua delayedCall bergantian (roll lalu hening): ditolak — dua timer
  = dua sumber bocor, cleanup lebih rumit.
- C. CSS animation infinite + animation-delay 5s: ditolak (tabrakan
  transform intro, stop/reset kasar — alasan yang sama seperti dulu).

## 5. Desain implementasi (untuk builder)

- `Hero.tsx`, ganti blok roll lama (delay 2.0, killer 2.0+5) dengan:
  ```ts
  const NAME_CHARS = ".line-name-main .char, .line-name-sub .char";
  const roll = gsap.timeline({ repeat: -1, delay: 2.0, defaults: { ease: "power2.inOut" } });
  roll
    .to(NAME_CHARS, { yPercent: -115, duration: 0.8, stagger: 0.06 })
    .to({}, { duration: 0.4 }) // napas: teks kosong di luar mask
    .to(NAME_CHARS, { yPercent: 0, duration: 0.8, stagger: 0.02 })
    .to({}, { duration: 5.0 }); // hening: jeda antar siklus
  ```
  Tanpa `set +115`: `.to(yPercent:0)` dari posisi -115 → GSAP
  menginterpolasi MELEWATI +115? TIDAK — `.to` dari -115 ke 0 =
  lurus turun lewat 0, bukan dari bawah. Maka `.set +115` TETAP perlu
  sebelum masuk:
  ```ts
  roll
    .to(NAME_CHARS, { yPercent: -115, duration: 0.8, stagger: 0.06 })
    .set(NAME_CHARS, { yPercent: 115 })
    .to({}, { duration: 0.4 })
    .to(NAME_CHARS, { yPercent: 0, duration: 0.8, stagger: 0.02 })
    .to({}, { duration: 5.0 });
  ```
  Total siklus ≈ 0.8+0.18(ekor stagger naik 9×0.06... 10 huruf → ekor
  9×0.06=0.54)+0.4+0.8+0.18+5.0 ≈ 7.7 dtk (roll terlihat ~2.5 dtk,
  hening 5 dtk). Diterima: "roll 2 dtk" = fase gerak inti, ekor stagger
  = bagian gelombang (justru yang diminta terlihat).
- Cleanup return tetap: `roll.kill() + set 0` (tanpa killer lagi).
- Komentar lama (kill 5 dtk, potong mid-putaran) dihapus/ditulis ulang.
- Verifikasi: tsc 0, oxlint 0, build lulus + probe: roll terlihat di
  t≈3 dtk DAN t≈12 dtk (siklus kedua = bukti tak mati), hening di
  t≈6-10 dtk (moving=0), exit scroll tetap PASS.

## 6. Diserahkan ke builder

- Tuning angka ritme bila probe/user minta (durasi, stagger, hening).
- Kill saat scroll mulai? (opsi: hentikan roll saat exit scrub aktif —
  TIDAK di desain ini; roll + exit beda elemen, komposisi normal).
