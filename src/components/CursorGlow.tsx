import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./CursorGlow.css";

/* K. Kursor cahaya (global, dekoratif) + geser bintang background.
   Trail partikel sprinkle DIMATIKAN per permintaan: mouse tidak lagi
   mengeluarkan partikel — sebagai gantinya bintang background di dekat
   mouse terdorong sedikit & kembali saat mouse pergi (di BlackHoleScene,
   murni fungsi posisi → otomatis kembali). Komponen ini hanya cahaya
   glow yang mengikuti kursor. Nonaktif di touch & reduced-motion. */

export default function CursorGlow() {
  const reduced = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    const pos = { x: -100, y: -100 };
    const sm = { x: -100, y: -100 };
    let raf = 0;
    let running = true;

    const onMove = (e: PointerEvent) => {
      // BUG 3: clamp ke viewport — mencegah glow "terlempar" jauh saat
      // pointer keluar-masuk iframe/nav atau event membawa koordinat liar.
      // Sumber tetap clientX/Y global dari window (bukan target relatif).
      // Catatan: sprinkle trail sudah dimatikan — geser bintang dikerjakan
      // BlackHoleScene (pure posisi → kembali otomatis). Di sini hanya glow.
      pos.x = Math.max(0, Math.min(e.clientX, window.innerWidth));
      pos.y = Math.max(0, Math.min(e.clientY, window.innerHeight));
      // Hover link → glow membesar (event delegation murah).
      const t = e.target as HTMLElement | null;
      glow.dataset.hot = t && t.closest("a,button") ? "1" : "";
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        last = performance.now();
        tick();
      }
    };

    let last = performance.now();
    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      sm.x += (pos.x - sm.x) * (1 - Math.exp(-dt / 0.12));
      sm.y += (pos.y - sm.y) * (1 - Math.exp(-dt / 0.12));
      // Double-clamp hasil smoothing agar glow tidak pernah keluar layar.
      const gx = Math.max(0, Math.min(sm.x, window.innerWidth));
      const gy = Math.max(0, Math.min(sm.y, window.innerHeight));
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
    };
    tick();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <div className="cursor-glow-root" aria-hidden="true">
      <div ref={glowRef} className="cursor-glow" />
    </div>
  );
}
