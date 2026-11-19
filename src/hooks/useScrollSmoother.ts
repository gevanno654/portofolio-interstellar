import { useEffect } from "react";
import { ScrollTrigger, ScrollSmoother } from "../lib/gsap";
import { useDesktop } from "./useDesktop";
// Tipe instance minimal Smoother — cukup untuk create/scrollTo/kill yang
// dipakai hook ini + 3 pemanggil imperatif (App/Journey/Orbit).
export type SmootherHandle = {
  scrollTo(target: unknown, smooth?: boolean, position?: string): void;
  kill(): void;
  paused(v?: boolean): boolean;
};

/* useScrollSmoother — smooth scroll global via ScrollSmoother GSAP inti
   (pengganti Lenis; struktur Smooth Wrapper ala Moncy — TANPA gsap-trial).
   - non-RM + desktop: ScrollSmoother.create(#smooth-wrapper/#smooth-content),
     trigger ScrollTrigger lain ikut scroller-nya otomatis.
   - RM/mobile: tidak dibuat sama sekali (scroll native + CSS).
   - Anchor #… dicegat → smoother.scrollTo (offset -64px di bawah nav fixed).
     Format posisi ScrollTrigger ("top top+=64px"): target TOP berhenti
     64px DI BAWAH viewport top (ruang nav fixed) — BUKAN di atasnya.
   - window.__smoother menyimpan instance untuk scrollTo imperatif
     (OrbitProgress, JourneyFlightPath, App finish). */

declare global {
  interface Window {
    __smoother?: SmootherHandle | undefined;
  }
}

export function useScrollSmoother(enabled: boolean): void {
  const desktop = useDesktop();
  useEffect(() => {
    if (!enabled || !desktop || typeof window === "undefined") return;

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.7,
      effects: true,
      smoothTouch: 0.1,
      ignoreMobileResize: true,
    }) as unknown as SmootherHandle;
    window.__smoother = smoother;
    ScrollTrigger.refresh();

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!(el instanceof HTMLAnchorElement)) return;
      const id = el.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      // KHUSUS #about: scroll ke TENGAH KONTEN (2026-11-18, revisi dari
      // ujung-pin): section ramping (553px < viewport) — ujung pin Y900
      // menempelkan konten ke ATAS viewport (offset -196px). Tengah konten
      // = Y704 di H900 (probe txtC=0). Rumus jujur semua layar: ujung pin
      // (innerHeight) − setengah selisih (viewport − tinggi section).
      if (id === "#about") {
        const sec = target as HTMLElement;
        const y = window.innerHeight - Math.max(0, (window.innerHeight - sec.offsetHeight) / 2);
        smoother.scrollTo(y, true);
      } else {
        smoother.scrollTo(target as HTMLElement, true, "top top+=64px");
      }
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      smoother.kill();
      if (window.__smoother === smoother) window.__smoother = undefined;
      // Trigger era-Smoother basi setelah kill (pin-spacer dilepas) —
      // refresh agar kalkulasi native pulih (toggle RM/unmount).
      ScrollTrigger.refresh();
    };
  }, [enabled, desktop]);
}
