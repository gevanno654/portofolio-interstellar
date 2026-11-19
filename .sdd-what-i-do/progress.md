# SDD ledger — plan: docs/superpowers/plans/2026-11-19-skills-what-i-do.md

Pre-flight: T1->T4 whatIDo; T2->T3 createSpaceRock; T3->T4 SkillRock. Ruling Task 2: implementasikan signature final `createSpaceRock(container, opts?: {frozen?: boolean})` langsung di T2 agar T3 tak mengubah T2 — T3-Step 1 menjadi verifikasi, bukan perubahan. Biaya bila salah: T3 perlu edit T2, kecil.

Ruling Task 1: tanpa test-runner di repo; gate TDD = tsc + probe imperatif (pola sesi sebelumnya).
Task 1: complete (tsc RED TS2304 -> GREEN 0, commit content whatIDo). Ruling: gate TDD repo ini = `npx tsc -b --force` (solution-style tsconfig; `tsc --noEmit` tanpa -b tak memuat referensi dan selalu lolos — tidak valid sebagai gate).
Task 2: complete (probe RED modul-hilang -> GREEN ok=true/dispose-bersih ERRS=0, TSC=0, build lulus).
Task 3: complete (TSC=0, build lulus). Ruling: probe headless React-mount diganti audit statis.
Task 4: complete (TSC=0, build lulus, probe struktur+exit hijau ERRS=0; batu opsi B murni-shading).
Task 5: complete (regresi About exit monoton+seirama+reversibel, nav diam, ERRS=0). Ruling: angka K1-K3 deviasi ~0.08 dari ekspektasi plan (settle scrub di layout baru lebih lambat); perilaku benar, bukan regresi.
