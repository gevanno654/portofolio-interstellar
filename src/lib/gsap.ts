import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// ScrollSmoother 3.15 (root gsap/ScrollSmoother.js): ESM murni dengan
// `export { ScrollSmoother as default }` TAPI tanpa `export` bernama —
// Vite dev mem-bundle-nya terpisah dan named-import gagal ("does not
// provide an export"). Solusi: rangkul default-export modul, lalu
// self-register ke inti (pola resmi gsap: registerPlugin masih perlu
// dipanggil manual untuk file root ini).
import ScrollSmootherDefault from "gsap/ScrollSmoother";

// Registrasi sekali di sini — semua komponen import dari modul ini.
gsap.registerPlugin(
  ScrollTrigger,
  ScrollSmootherDefault as unknown as Parameters<typeof gsap.registerPlugin>[0],
);

const ScrollSmoother = ScrollSmootherDefault as unknown as {
  new (vars?: object): {
    scrollTo(target: unknown, smooth?: boolean, position?: string): void;
    kill(): void;
    paused(v?: boolean): boolean;
  };
  create(vars?: object): {
    scrollTo(target: unknown, smooth?: boolean, position?: string): void;
    kill(): void;
    paused(v?: boolean): boolean;
  };
};

export { gsap, ScrollTrigger, ScrollSmoother };
