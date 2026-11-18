import { Suspense, lazy, useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import OrbitalSigil from "./OrbitalSigil";

// Lazy: black hole slot terpisah dari chunk utama (pola Cosmos/A).
const HeroBlackHole = lazy(() => import("./HeroBlackHole"));

/* Slot ornament kolom kanan hero: lubang hitam live (WebGL) vs E (fallback).
   WebGL ok + non-RM → black hole; selain itu → OrbitalSigil.
   Render SEKALI — tanpa foto/wajah/figur. */

function webglOK(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.classList.contains("no-webgl")) return false;
  if (new URLSearchParams(window.location.search).has("no-webgl")) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroStage() {
  const reduced = useReducedMotion();
  const [ok, setOk] = useState(false);

  // Probe WebGL setelah mount (Cosmos/A menandai .no-webgl secara async).
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const probe = () => {
      if (webglOK()) {
        setOk(true);
        return;
      }
      if (++frames < 60) raf = requestAnimationFrame(probe);
    };
    raf = requestAnimationFrame(probe);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (reduced || !ok) return <OrbitalSigil />;
  return (
    <Suspense fallback={<OrbitalSigil />}>
      <HeroBlackHole />
    </Suspense>
  );
}
