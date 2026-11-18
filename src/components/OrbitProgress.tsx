import { useEffect, useRef } from "react";
import type { SmootherHandle } from "../hooks/useScrollSmoother";
import { ScrollTrigger } from "../lib/gsap";
import "./OrbitProgress.css";

/* L. Scroll progress orbit mini black hole (fungsional, bukan hiasan).
   Arc accretion = progress; satelit mengorbit ∝ progress.
   Tetap update saat reduced-motion (fungsi, bukan animasi dekoratif). */

const R = 15.9155; // r → keliling 100 persis

export default function OrbitProgress() {
  const arcRef = useRef<SVGCircleElement>(null);
  const satRef = useRef<SVGGElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let st: ScrollTrigger | undefined;
    let raf = 0;
    let pending = 0;
    let disposed = false;

    const bar = btnRef.current?.querySelector<HTMLElement>(".op-bar");
    const apply = (p: number) => {
      const arc = arcRef.current;
      const sat = satRef.current;
      const btn = btnRef.current;
      if (!arc || !sat || !btn) return;
      arc.setAttribute("stroke-dashoffset", String(100 * (1 - p)));
      bar?.style.setProperty("--p", String(p));
      const a = p * Math.PI * 2 - Math.PI / 2;
      const cx = 20 + 14 * Math.cos(a);
      const cy = 20 + 14 * Math.sin(a);
      sat.setAttribute("transform", `translate(${cx} ${cy})`);
      btn.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    };

    const schedule = (p: number) => {
      pending = p;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!disposed) apply(pending);
      });
    };

    st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => schedule(self.progress),
    });
    // Seed dari progress trigger (bukan scrollY mentah — Smoother
    // menghaluskan window.scrollY; baca progress = tanpa fase/judder).
    schedule(st.progress);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      st?.kill();
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      className="orbit-progress"
      role="progressbar"
      aria-label="Scroll progress — back to top"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      onClick={() => {
        const smoother: SmootherHandle | undefined = window.__smoother;
        if (smoother) smoother.scrollTo(0, true);
        else
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
      }}
    >
      {/* Fallback bar linear: tampil bila SVG gagal render. */}
      <span className="op-bar" aria-hidden="true" />
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="6" className="op-hole" />
        <circle cx="20" cy="20" r={R} className="op-track" />
        <circle ref={arcRef} cx="20" cy="20" r={R} className="op-arc" />
        <g ref={satRef} transform="translate(20 6)">
          <circle r="2" className="op-sat" />
        </g>
      </svg>
    </button>
  );
}
