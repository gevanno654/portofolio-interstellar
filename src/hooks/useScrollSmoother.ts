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
      // KHUSUS #about: scroll ke UJUNG pin = 1 viewport aktual
      // (window.innerHeight), BUKAN angka mati. (Probe: pin hero
      // "+=100%" = tepat 1 viewport — di H900 ujungnya Y900 = tengah
      // sempurna centerOff=0; angka mati 900 di H700/H1080 meleset.
      // innerHeight = ujung pin di SEMUA layar = blok tengah + teks
      // jatuh penuh.) Section lain tetap ke elemen (offset nav standar).
      if (id === "#about") {
        smoother.scrollTo(window.innerHeight, true);
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
