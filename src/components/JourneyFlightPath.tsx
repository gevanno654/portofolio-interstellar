import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { SmootherHandle } from "../hooks/useScrollSmoother";
import { ScrollTrigger } from "../lib/gsap";
import "./JourneyFlightPath.css";

declare global {
  interface Window {
    __smoother?: SmootherHandle | undefined;
  }
}

/* Elemen J — flight path vertikal + marker segitiga.
   Budget: 1 path + 1 marker. Posisi marker via getPointAtLength(progress),
   update di-throttle rAF dari callback scrub ScrollTrigger.
   Klik marker → scroll ke entri terkait. RM → garis+marker statis.
   Fallback non-RM tanpa JS gerak: CSS menaruh marker di entri pertama. */

export default function JourneyFlightPath({ ids }: { ids: string[] }) {
  const reduced = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const path = pathRef.current;
    const marker = markerRef.current;
    if (!path || !marker) return;

    let len = 0;
    let raf = 0;
    let pending = -1;
    let st: ScrollTrigger | undefined;

    const measure = () => {
      try {
        len = path.getTotalLength();
      } catch {
        len = 0;
      }
    };

    const place = (p: number) => {
      if (len <= 0 || reduced) return;
      const pt = path.getPointAtLength(Math.min(1, Math.max(0, p)) * len);
      marker.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    };

    // Throttle rAF: callback scrub hanya menyimpan progress, DOM ditulis
    // sekali per frame.
    const kick = (p: number) => {
      pending = p;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (pending >= 0) {
            place(pending);
            pending = -1;
          }
        });
      }
    };

    measure();
    place(0);
    window.addEventListener("resize", measure);
    st = ScrollTrigger.create({
      trigger: ".journey-track",
      start: "top 75%",
      end: "bottom 55%",
      scrub: 0.6,
      onUpdate: (self) => kick(self.progress),
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      st?.kill();
    };
  }, [reduced]);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const smoother = window.__smoother;
    if (smoother) smoother.scrollTo(el, true, "top top+=64px");
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  return (
    <div ref={railRef} className={`flight-rail${reduced ? " flight-rm" : ""}`} aria-hidden="true">
      <svg
        className="flight-svg"
        viewBox="0 0 20 600"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          ref={pathRef}
          className="flight-path"
          d="M10,8 C16,120 4,220 10,310 C16,400 4,500 10,592"
          fill="none"
        />
        <g ref={markerRef} className="flight-marker" transform="translate(10 8)">
          <circle className="flight-ring" r="7" />
          <path className="flight-tri" d="M0,-4 L3.5,2.5 L-3.5,2.5 Z" />
        </g>
        {ids.map((id, i) => (
          <circle
            key={id}
            className="flight-stop"
            cx="10"
            cy={8 + (i / Math.max(1, ids.length - 1)) * 584}
            r="3.5"
            data-stop={id}
            onClick={() => goTo(id)}
            style={{ pointerEvents: "auto" }}
          />
        ))}
      </svg>
    </div>
  );
}
