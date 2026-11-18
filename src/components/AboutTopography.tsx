import { useDesktop } from "../hooks/useDesktop";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useGsapScope } from "../hooks/useGsapScope";
import { gsap } from "../lib/gsap";
import { TARGETS, SCATTER } from "./taurusData";
import "./AboutTopography.css";

/* Elemen F — rasi Taurus perakitan scroll.
   Awal (belum di about): 10 bintang tersebar acak (seeded, stabil).
   Saat about masuk: bintang berkumpul ke posisi Taurus + 8 garis
   rasi ter gambar. 10 rasi + 8 latar + 8 garis = 26 node SVG.
   Tanpa foto/wajah/siluet manusia. RM → Taurus statis jadi.
   Desktop: perakitan dimiliki MASTER di Hero.tsx (paruh-2 satu
   timeline 200px); di sini hanya sebar awal (tanpa tween kumpul). */

/* 8 bintang LATAR: statis acak, tidak ikut merangkai — warna-warni
   (biru, emas, putih, rose) agar langit hidup di sekitar rasi. */
const EXTRAS: Array<[number, number, number, string]> = [
  [36, 210, 1.6, "#8fa3c4"],
  [88, 250, 1.8, "#f0c98a"],
  [210, 40, 1.5, "#cfe0ff"],
  [292, 120, 1.8, "#e8a0a0"],
  [290, 262, 1.5, "#e8e2d2"],
  [60, 160, 1.4, "#9ad0c2"],
  [228, 130, 1.4, "#d8c49a"],
  [120, 250, 1.5, "#b9cdf0"],
];

/* 8 garis: 0-1-2-3-4-5-6 rantai + 4-7-8 cabang tanduk bawah. */
const LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [4, 7],
  [7, 8],
];

export default function AboutTopography() {
  const reduced = useReducedMotion();
  const desktop = useDesktop();

  const ref = useGsapScope<HTMLElement>((_ctx, scope) => {
    if (reduced || !scope) return;
    // DESKTOP (alir natural): perakitan punya TRIGGER VIEWPORT SENDIRI
    // (bukan master) — merangkai saat figure terlihat. Pola sama dengan
    // mobile, jendela disamakan (top 85%→top 45%).
    gsap.set(".topo-rasi", {
      attr: { cx: (i: number) => SCATTER[i][0], cy: (i: number) => SCATTER[i][1] },
    });
    gsap.set(".topo-link", { opacity: 0, strokeDashoffset: 1 });
    const ttl = gsap.timeline({
      scrollTrigger: { trigger: scope, start: "top 85%", end: "top 45%", scrub: 0.6 },
    });
    ttl.to(
      ".topo-rasi",
      {
        attr: { cx: (i: number) => TARGETS[i].x, cy: (i: number) => TARGETS[i].y },
        ease: "none",
        duration: 1,
      },
      0,
    );
    ttl.to(".topo-link", { opacity: 1, strokeDashoffset: 0, ease: "none", duration: 0.4 }, 0.6);
    if (desktop) return;
    // HANYA rasi (.topo-rasi) yang disebar/dikumpulkan — latar (.topo-extra)
    // statis. Dulu selector ".topo-star" mencakup 18 circle sementara
    // SCATTER/TARGETS hanya 10 → SCATTER[i] undefined → crash blank hitam.
    gsap.set(".topo-rasi", {
      attr: { cx: (i: number) => SCATTER[i][0], cy: (i: number) => SCATTER[i][1] },
    });
    gsap.set(".topo-link", { opacity: 0, strokeDashoffset: 1 });
    // Masuk about → bintang berkumpul + garis rasi tergambar (scrub).
    const tl = gsap.timeline({
      scrollTrigger: { trigger: scope, start: "top 88%", end: "top 42%", scrub: 0.6 },
    });
    tl.to(
      ".topo-rasi",
      {
        attr: { cx: (i: number) => TARGETS[i].x, cy: (i: number) => TARGETS[i].y },
        ease: "none",
        duration: 1,
      },
      0,
    );
    tl.to(".topo-link", { opacity: 1, strokeDashoffset: 0, ease: "none", duration: 0.4 }, 0.6);
  }, [reduced, desktop]);

  return (
    <figure ref={ref} className={`about-visual topo${reduced ? " topo-rm" : ""}`}>
      <svg className="topo-svg" viewBox="0 0 320 300" aria-hidden="true" focusable="false">
        {/* Latar: statis, tidak ikut animasi berkumpul. */}
        {EXTRAS.map(([cx, cy, r, c], i) => (
          <circle
            key={`x${i}`}
            className="topo-star topo-extra"
            cx={cx}
            cy={cy}
            r={r}
            style={{ fill: c, ["--tw" as string]: `${(i * 0.53 + 0.4) % 3}s` }}
          />
        ))}
        {LINKS.map(([a, b], i) => (
          <line
            key={i}
            className="topo-link"
            x1={TARGETS[a].x}
            y1={TARGETS[a].y}
            x2={TARGETS[b].x}
            y2={TARGETS[b].y}
            pathLength={1}
          />
        ))}
        {TARGETS.map((s, i) => (
          <circle
            key={i}
            className={`topo-star topo-rasi${i === 4 ? " topo-star-bright" : ""}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{ fill: s.color, ["--tw" as string]: `${(i * 0.37) % 3}s` }}
          >
            <title>{s.name}</title>
          </circle>
        ))}
      </svg>
      {/* Caption deskripsi Taurus DIHAPUS per permintaan — rasi murni visual. */}
    </figure>
  );
}
