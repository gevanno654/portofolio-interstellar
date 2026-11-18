import { useEffect, useRef } from "react";
import "./OrbitalSigil.css";

/* E. Fallback 2D untuk D: 3 elips orbit + 3 satelit, canvas 2D.
   Tampil bila WebGL gagal ATAU reduced-motion.
   Budget: 8 path/frame (2 inti + 3 orbit + 3 satelit).
   Pointer → inklinasi ±5°; RM → 1 frame statis. */

const ORBITS = [
  { rx: 100, ry: 34, speed: 0.55, size: 3.5, color: "#c4a477" },
  { rx: 72, ry: 26, speed: -0.8, size: 2.5, color: "#d9dce5" },
  { rx: 44, ry: 17, speed: 1.1, size: 2, color: "#8fa3c4" },
];
// Skala agar orbit terluar (rx 100 + satelit 3.5px) muat di setengah
// sisi terkecil dengan margin ~12% — anti terpotong di semua viewport.
const ORBIT_FIT = 0.85;
const MAX_SQUASH = (5 * Math.PI) / 180; // ±5°

export default function OrbitalSigil() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const host = canvas.parentElement;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let squash = 0;
    let squashT = 0;
    const t0 = performance.now();

    const draw = (t: number) => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = host.clientWidth || 320;
      const h = host.clientHeight || 320;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const elapsed = (t - t0) / 1000;

      squash += (squashT - squash) * 0.1;
      const sy = Math.cos(squash);
      // Fit responsif: radius orbit diskala ke sisi terkecil wadah
      // (rx 100 → 0.85 × setengah sisi), jadi orbit + satelit selalu
      // di dalam kanvas dengan margin di semua viewport.
      const fit = (Math.min(w, h) / 2 / 100) * ORBIT_FIT;
      const rx = (r: number) => r * fit;

      // Inti: 2 path.
      ctx.fillStyle = "#c4a477";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(196, 164, 119, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 3 orbit + 3 satelit: 6 path.
      for (let i = 0; i < ORBITS.length; i++) {
        const o = ORBITS[i];
        ctx.strokeStyle = "rgba(143, 163, 196, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx(o.rx), o.ry * fit * sy + 0.001, 0, 0, Math.PI * 2);
        ctx.stroke();
        const a = elapsed * o.speed + (i * Math.PI * 2) / 3;
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rx(o.rx), cy + Math.sin(a) * o.ry * fit * sy, o.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      if (!visible || document.hidden) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
      draw(performance.now());
    };
    const kick = () => {
      if (!reduced && visible && !raf && !document.hidden) raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      draw(t0); // 1 frame statis, tanpa rAF lanjutan.
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onPointer = (e: PointerEvent) => {
      squashT = Math.max(-MAX_SQUASH, Math.min(MAX_SQUASH, (e.clientX / window.innerWidth - 0.5) * 2 * MAX_SQUASH));
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      kick();
    });
    io.observe(host);
    // ResizeObserver: ukuran kanvas ikut wadah (breakpoint/font-load
    // tidak memicu window.resize), tanpa rAF tambahan saat RM.
    const ro = new ResizeObserver(() => {
      if (reduced) draw(performance.now());
    });
    ro.observe(host);

    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", kick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", kick);
    };
  }, []);

  return (
    <div className="orbital-sigil" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
