# ASSETS & PLACEHOLDERS — Beyond the Event Horizon

Semua konten yang perlu diganti terpusat di [`src/content.ts`](src/content.ts).
Cari `TODO` di file itu — setiap placeholder sudah ditandai.

## 1. Identitas (`site`)

| Field | Status | Keterangan |
|---|---|---|
| `name` / `initials` | ✅ Terisi (GevannoYoh / GY) | — |
| `role`, `specialty`, `heroLede` | Placeholder | Tulis 1–2 kalimat spesialisasi asli |
| `email` | `hello@gevannoyoh.dev` | Ganti email asli |
| `location`, `availability` | Placeholder | Kota & status ketersediaan |
| `socials` | URL generik | Ganti URL GitHub / LinkedIn / CV asli |

## 2. Visual About (tanpa foto pemilik)

- Section About murni tekstual + fakta; tidak ada bingkai foto maupun foto pemilik, sesuai kebijakan visual abstrak/kosmik situs.
- Jika butuh aksen visual: tambah elemen geometris prosedural (mis. peta konstelasi SVG atau kontur topografi CSS), bukan foto atau figur.

## 3. Thumbnail proyek (Projects)

- Saat ini: `<Thumb>` prosedural (radial glow + grid + nomor indeks) per proyek.
- Pengganti: gambar **16:10** (mis. `public/projects/nama-proyek.jpg`), ganti `<Thumb p={p} />` dengan `<img>` + `loading="lazy"`. Pola layout (`bleed` / `split` / `index`) tidak bergantung pada gambar — aman diganti 1:1.
- Tambah proyek baru: tambah entri di array `projects` di `content.ts` dengan `layout` pilihan.

## 4. Teks konten

- `about.body`, `about.facts` — bio & fakta pendidikan/minat.
- `skillGroups[].items` — daftar skill per kategori (hapus entri `TODO`).
- `projects[]` — judul, deskripsi, stack, tahun, `github`, `live` asli.
- `journey[]` — pendidikan, pengalaman, sertifikasi (urut kronologis).
- `closing.note` — kalimat penutup personal.

## 5. Font (sudah final, opsional diganti)

- Display: Fraunces · Body: Space Grotesk · Mono: IBM Plex Mono — dimuat via Google Fonts di `index.html`.
- Untuk self-host (privasi/offline): unduh woff2, simpan di `public/fonts/`, ganti `<link>` dengan `@font-face` di `tokens.css`.

## 6. Tidak perlu aset eksternal (termasuk tanpa foto/karakter)

Black hole, accretion disk, starfield, grain — semuanya prosedural (GLSL). Tidak ada foto pemilik, avatar, atau figur humanoid di situs. Favicon boleh diganti dengan mark "GY" custom di `public/`.
