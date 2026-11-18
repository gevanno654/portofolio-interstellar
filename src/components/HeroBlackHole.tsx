import "./HeroBlackHole.css";

/* Slot ornament hero: PENAMPUNG TRANSPARAN untuk lubang global (Cosmos).
   BlackHoleScene SATU-SATUNYA me-render lubang di posisi slot ini
   (jangkar diukur dari elemen ini) — tanpa canvas kedua di sini.
   Fade: saat #about masuk, Cosmos mem-fade lubang global ke 0.
   WebGL gagal/RM → OrbitalSigil (dari HeroStage). */

export default function HeroBlackHole() {
  return <div className="hero-ornament hero-blackhole" aria-hidden="true" />;
}
