import { useEffect, useRef, useState } from "react";
import Cosmos from "./components/Cosmos";
import CursorGlow from "./components/CursorGlow";
import OrbitProgress from "./components/OrbitProgress";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Journey from "./components/Journey";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WormholeTransition, { type WormholeRequest } from "./components/WormholeTransition";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useScrollSmoother } from "./hooks/useScrollSmoother";
import type { SceneHandle } from "./three/BlackHoleScene";
import "./styles/tokens.css";
import "./styles/global.css";

function setDustPaused(on: boolean) {
  try {
    const h = (window as unknown as { __sceneHandle?: SceneHandle }).__sceneHandle;
    if (h) h.wormholeActive = on;
  } catch {
    /* abaikan */
  }
}

export default function App() {
  const reduced = useReducedMotion();
  useScrollSmoother(!reduced);
  const [worm, setWorm] = useState<WormholeRequest | null>(null);
  const wormRef = useRef<WormholeRequest | null>(null);

  // Dipicu dari kartu proyek (Projects memanggil window.__wormholeOpen).
  // Return false = overlay tidak dibuka (klik diabaikan + popup ditutup).
  useEffect(() => {
    (window as unknown as { __wormholeOpen?: (d: WormholeRequest) => boolean }).__wormholeOpen = (d) => {
      if (wormRef.current) return false;
      wormRef.current = d;
      setWorm(d);
      return true;
    };
  }, []);

  const close = () => {
    wormRef.current = null;
    setWorm(null);
  };

  // AKHIR animasi maju (±600ms): navigasi TERJADI DI SINI — setelah user
  // sempat melihat lubang membesar. Masih dalam transient activation,
  // jadi window.open tidak diblokir popup-blocker tanpa pre-open tab.
  // - Eksternal: buka tab baru, overlay ditutup.
  // - Internal/placeholder ("#projects"): tutup overlay lalu scroll ke kartu.
  const finish = () => {
    const w = wormRef.current;
    wormRef.current = null;
    setWorm(null);
    if (!w) return;
    if (w.external) {
      try {
        window.open(w.url, "_blank", "noopener,noreferrer");
      } catch {
        /* abaikan */
      }
    } else {
      const el = document.getElementById(`proj-${w.slug}`);
      if (el) {
        const smoother = window.__smoother;
        if (smoother) smoother.scrollTo(el, true, "top top+=64px");
        else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }
    }
  };

  return (
    <>
      <Cosmos />
      <CursorGlow />
      <OrbitProgress />
      <Nav />
      {/* Canvas + overlay fixed HARUS di luar wrapper: ScrollSmoother
          menjadikan #smooth-wrapper position:fixed — semua descendant
          fixed (Cosmos, Nav, glow, orbit, wormhole) akan ter-dose ke
          koordinat wrapper dan patah. Hanya konten scroll di dalam. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main>
            <Hero />
            <About />
            <Skills />
            <Projects />
            <Journey />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
      {/* Elemen I: overlay wormhole antar halaman proyek. */}
      <WormholeTransition
        active={worm !== null}
        label={worm?.title ?? ""}
        ox={worm?.x ?? 0.5}
        oy={worm?.y ?? 0.5}
        reduced={reduced}
        onToggle={setDustPaused}
        onDone={finish}
        onCancel={close}
      />
    </>
  );
}
