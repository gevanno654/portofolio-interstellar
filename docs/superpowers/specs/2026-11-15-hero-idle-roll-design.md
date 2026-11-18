# Design: Hero Idle Roll (GEVANNO YOH)

Tanggal: 2026-11-15
Pendekatan: A — GSAP roll per-karakter (dipilih user)

## 1. Intent & Why

Hero terasa statis setelah intro selesai. moncy.dev punya idle animation:
teks di-split per huruf (`split-h2`), tiap huruf meluncur ke atas-hilang
lalu muncul lagi dari bawah — teks yang sama (bukan rotasi kata).
Direplikasi di baris GEVANNO YOH saja, berhenti otomatis setelah 5 detik
agar tidak mengganggu fokus.

## 2. Goals / Non-goals / Anti-goals

Goals:
- Roll per-karakter di `.line-name-main .char` + `.line-name-sub .char`
  (10 huruf): `yPercent 0 → -115` stagger 0.02 (naik-hilang),
  `set +115`, `→ 0` (masuk dari bawah). Berulang selama idle.
- Mulai setelah intro selesai (~1.7 dtk); berhenti + reset ke 0
  setelah 5 dtk idle (≈2 putaran). Timer dihitung sejak idle mulai.
- Tak berebut: idle menulis `.char` (transform per-huruf); exit scroll
  menulis `.hero-content` (container) — beda elemen, deterministik.
- Reduced-motion: tidak ada idle sama sekali.

Non-goals:
- Tidak menyentuh "Hello! I'm", "A fullstack developer", scroll-hint.
- Tidak mengubah copy, warna, layout.

Anti-goals:
- Idle menabrak intro (flicker saat load) atau exit scroll (stuck).
- Idle jalan selamanya (wajib mati ≤5 dtk + reset bersih).

## 3. Constraints

- Intro `.char` selesai ~1.65 dtk (0.25+0.9 stagger; role 0.85+0.8) →
  idle `delay: 1.7` agar tak tabrakan transform.
- Mask `.line` sudah `overflow:hidden` → huruf yang bergeser ±115%
  otomatis terpotong di dalam baris (efek moncy apa adanya).
- Baris GEVANNO + YOH = 2 `.line-inner` terpisah; stagger lintas baris
  diteruskan (satu seleksi, urutan DOM) agar gelombang kontinu.
- Folder bukan git: tanpa commit.

## 4. Approaches

- A. GSAP roll per-karakter (DIPILIH): timeline `repeat:-1`, kill di 5 dtk
  + `set yPercent:0`. Sinkron GSAP-intro, stop bersih.
- B. CSS keyframes: ditolak user-implisit (tabrakan transform intro,
  stop kasar).
- C. Roll satu blok: ditolak (bukan efek per-huruf moncy).

## 5. Desain implementasi (untuk builder)

- `Hero.tsx`, di `useGsapScope` setelah `tl` intro (jalur desktop & mobile
  sama — idle bukan scroll, jadi berlaku di semua breakpoint; RM return awal):
  ```ts
  const roll = gsap.timeline({ repeat: -1, delay: 1.7, defaults: { ease: "power2.inOut" } });
  roll.to(".hero-name-main .char, .hero-name-sub .char", { yPercent: -115, duration: 0.45, stagger: 0.02 })
      .set(".hero-name-main .char, .hero-name-sub .char", { yPercent: 115 })
      .to(".hero-name-main .char, .hero-name-sub .char", { yPercent: 0, duration: 0.45, stagger: 0.02 })
      .to({}, { duration: 0.6 }); // jeda antar putaran
  gsap.delayedCall(1.7 + 5, () => { roll.kill(); gsap.set(chars, { yPercent: 0 }); });
  ```
  Selektor disesuaikan ke kelas aktual (`.line-name-main .char`,
  `.line-name-sub .char`); pakai referensi elemen langsung bila perlu
  agar lolos scoping context.
- Timer kill didaftarkan sebagai cleanup tambahan `useGsapScope`
  (return cleanup melepas `delayedCall` + kill bila unmount < 5 dtk).
- Verifikasi: tsc 0, oxlint 0, build lulus + probe visual (roll terlihat
  1.7–6.7 dtk, setelah itu `.char` yPercent 0; exit scroll tetap PASS).

## 6. Diserahkan ke builder

- Durasi per fase roll (0.45) + jeda putaran (0.6): tuning feel.
- Kill tepat 5.0 dtk vs kill di batas putaran (tunggu putaran selesai).
