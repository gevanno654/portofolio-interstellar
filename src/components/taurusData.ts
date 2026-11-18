/* Data rasi Taurus — dipakai AboutTopography + master 2-notch Hero.
   Dipisah ke modul sendiri agar file komponen hanya ekspor komponen
   (fast-refresh / only-export-components bersih). */

export type Star = { x: number; y: number; r: number; name: string; color: string };

/* Taurus (viewBox 320x300): Elnath ujung tanduk atas → lengkung
   Hyades-V (Gamma–Delta–Aldebaran–Epsilon–Theta) → tanduk bawah
   (mid–Zeta); Pleiades satu titik gugus tanpa garis.
   Warna-warni: oranye raksasa, putih hangat, biru muda, keemasan. */
export const TARGETS: Star[] = [
  { x: 64, y: 44, r: 3.5, name: "Elnath", color: "#b9cdf0" },
  { x: 108, y: 74, r: 2.5, name: "Tanduk atas", color: "#e8e2d2" },
  { x: 146, y: 104, r: 3, name: "Gamma", color: "#f0c98a" },
  { x: 138, y: 132, r: 2.5, name: "Delta", color: "#e8e2d2" },
  { x: 158, y: 152, r: 5, name: "Aldebaran", color: "#f0b46a" },
  { x: 148, y: 172, r: 2.5, name: "Epsilon", color: "#d8c49a" },
  { x: 136, y: 196, r: 2.5, name: "Theta", color: "#b9cdf0" },
  { x: 204, y: 190, r: 2.5, name: "Tanduk bawah", color: "#e8e2d2" },
  { x: 252, y: 222, r: 3.5, name: "Zeta", color: "#8fa3c4" },
  { x: 252, y: 66, r: 2.5, name: "Pleiades", color: "#cfe0ff" },
];

/* Sebaran acak awal — PRNG seeded agar stabil antar render/build. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SCATTER: Array<[number, number]> = (() => {
  const rnd = mulberry32(20261109);
  return TARGETS.map(() => [24 + rnd() * 272, 24 + rnd() * 252] as [number, number]);
})();
