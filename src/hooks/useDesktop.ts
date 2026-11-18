import { useEffect, useState } from "react";

/* Lebar desktop (>900px) sebagai state reaktif — SAMA pola useReducedMotion.
   Guard `window.innerWidth` sekali-saat-mount tidak menangani resize/rotasi
   yang melintasi breakpoint: Smoother + timeline pin Hero + reveal About
   harus rebuild saat breakpoint berubah (cleanup effect sudah aman). */
export function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 901px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return desktop;
}
