import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./ProjectCard.css";

/* Elemen H — bingkai tilt 3D CSS untuk thumbnail proyek.
   Compositor-only: hanya transform + opacity. Tanpa WebGL.
   Pointer tilt maks 8° dengan lerp rAF; 2 lapis inner (thumb z=28px,
   glow z=48px). Touch → tilt mati. RM → tilt mati, kartu datar. */

const TILT_MAX = 8;

export default function ProjectCard({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const el = frameRef.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let hovering = false;

    const loop = () => {
      raf = 0;
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg)`;
      if (hovering || Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        el.style.transform = "";
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
      const py = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
      tx = Math.max(-TILT_MAX, Math.min(TILT_MAX, -py * 2 * TILT_MAX));
      ty = Math.max(-TILT_MAX, Math.min(TILT_MAX, px * 2 * TILT_MAX));
      kick();
    };
    const onEnter = () => {
      hovering = true;
      kick();
    };
    const onLeave = () => {
      hovering = false;
      tx = 0;
      ty = 0;
      kick();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    // TANPA data-speed: parallax kartu dimiliki tween manual yPercent
    // di Projects.tsx (baca dataset saat itu). Atribut data-speed di sini
    // direbut Smoother effects (ratio 5x = kartu lepas 500px+).
    <div className="tilt-scene" data-tilt-speed="5">
      <div ref={frameRef} className="tilt-frame" data-tilt={reduced ? "off" : "on"}>
        {children}
      </div>
    </div>
  );
}
