import { useEffect, useRef } from "react";
import HeroStage from "./HeroStage";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useDesktop } from "../hooks/useDesktop";

/* Layer langit global: satu canvas fixed di belakang seluruh halaman.
   Scroll halaman → nilai 0..1 → resesi black hole di shader.
   Slot jangkar lubang (.hero-slot-global) tinggal DI SINI — di luar
   pohon pin GSAP hero. Pin mengubah .hero jadi position:fixed saat
   scrub; slot di dalam hero ikut ter-fixed → jangkar bergeser. */
export default function Cosmos() {
  const hostRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useDesktop();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    document.documentElement.classList.add("js");

    // Reduced motion → langit statis, tanpa WebGL loop
    if (reduced) {
      document.documentElement.classList.add("no-webgl");
      return;
    }

    // Three.js dimuat async → chunk terpisah, first paint tidak diblokir.
    let cancelled = false;
    let st: ScrollTrigger | undefined;
    let disposeScene = () => {};

    // Lubang SELALU penuh di slot hero (uHoleVis dikelola scene dari mix).
  // Di Cosmos lama: 0 di hero → lubang global tak pernah terlihat di atas.
  // Kini satu-satunya lubang = yang di slot → set penuh sejak awal.
  import("../three/BlackHoleScene").then(({ createScene }) => {
      if (cancelled || !host.isConnected) return;
      const handle = createScene(host);
      if (!handle.ok) return; // fallback CSS (.no-webgl) sudah dipasang

      // Warp: lubang menyusut cepat di awal perjalanan, lalu melambat.
      // Konten section terbebas dari disk terang sesegera mungkin.
      // ERA EXIT (2026-11-19): About exit = PEMILIK hole di rentangnya —
      // skip paksa-1 bila bendera aktif (aturan: satu penulis per posisi
      // scroll; pemaksa tiap tick = exit tak pernah terlihat).
      const update = (progress: number) => {
        handle.setScroll(1 - Math.pow(1 - progress, 2.2));
        if ((window as unknown as { __aboutExitActive?: boolean }).__aboutExitActive !== true) {
          handle.setHoleVis(1);
        }
      };
      // Elemen C: velocity dari turunan scroll (px/s, + = turun),
      // diteruskan ke debu kosmik; decay eksponensial di dalam RAF.
      // Smoother sudah menghaluskan window.scrollY — baca progress
      // trigger (0..1) langsung, buka scrollY mentah (fase/judder).
      // Efek Smoother membuat progress tetap; baca TIDAK perlu.
      st = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          update(self.progress);
          handle.setVelocity(self.getVelocity());
        },
      });
      update(0);
      disposeScene = handle.dispose;
    });

    return () => {
      cancelled = true;
      st?.kill();
      disposeScene();
    };
  }, [reduced]);

  // TRAVEL SLOT (desktop non-RM): hero DIAM; saat scroll about, slot
  // bergeser MULUS kanan→kiri TANPA berubah ukuran (width tetap 90vw —
  // permintaan: satu ukuran asli hero di mana pun). Shader mengisi slot
  // penuh → lubang menetap sama besar. Ujung numerik (vw→vw, tanpa
  // "auto") agar terinterpolasi mulus. Scroll balik = kembali.
  // Gerak milik slot DOM (CSS) — scene hanya MEMBACA rect tiap frame
  // (measureSlot). Tiga efek ikut progress travel: cermin kemiringan
  // disk (+15°→−15°) via setMirror + ramping font via kelas .slim
  // pada .about-text. Mobile/RM: statis.
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || reduced || !desktop) return;
    const travel = gsap.fromTo(
      slot,
      // State hero = nilai CSS awal: fromTo eksplisit agar revert bersih
      // saat breakpoint berubah (cleanup di bawah).
      // right -22vw→48vw + width TETAP 90vw: lubang seukuran hero,
      // bergeser kiri (+10vw dari sebelumnya: sedikit lebih ke kanan di
      // about) hingga kabut kanannya menemani teks tanpa menutupinya.
      // Ukuran MENETAP (width tak di-tween) di mana pun.
      { width: "90vw", right: "-22vw", top: "52%" },
      {
        right: "48vw",
        top: "50%",
        ease: "none",
        scrollTrigger: {
          // Rentang PIN hero (posisi absolut 0→900, selaras exit +=100%):
          // pin-spacer menggeser titik elemen (posisi elemen bergeser,
          // absolut tidak).
          trigger: document.querySelector(".hero") ?? "#about",
          start: 0,
          end: 900,
          scrub: 0.6,
          // Progress travel = satu sumber tiga efek (slot + mirror + slim):
          // handle scene diambil dari window (diisi async BlackHoleScene).
          onUpdate: (self) => {
            const h = (window as unknown as { __sceneHandle?: { setMirror: (v: number) => void } }).__sceneHandle;
            h?.setMirror(self.progress);
            document.querySelector(".about-text")?.classList.toggle("slim", self.progress > 0);
          },
        },
      },
    );
    return () => {
      travel.scrollTrigger?.kill();
      travel.kill();
      gsap.set(slot, { clearProps: "all" });
      document.querySelector(".about-text")?.classList.remove("slim");
    };
  }, [reduced, desktop]);

  return (
    <div ref={hostRef} className="cosmos" aria-hidden="true">
      <div ref={slotRef} className="hero-slot-global" aria-hidden="true">
        <HeroStage />
      </div>
    </div>
  );
}
