import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import { whatIDo, type WhatIDoItem } from "../content";
import SkillRock from "./SkillRock";
import "./Skills.css";

/* What I Do: judul sticky + 3 blok (Develop batu 3D kiri/teks kanan;
   Design cermin; Broadcast kiri/teks kanan).
   Masuk: grow 0.3→1 per blok. Exit blok 1–2: zoom 1→1.35 + fade, scrub
   reversibel (pola exit About: scrub 0.6 / ease none / fromTo +
   immediateRender:false). RM → statis penuh, tanpa trigger. */

/* Pecah teks jadi span per karakter (pola Chars Hero: visual saja,
   aria disembunyikan, label utuh tetap di aria-label h2). */
function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span key={i} className="char" aria-hidden="true">
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

/* Satu blok What I Do: flip ganjil (teks kiri, visual kanan). */
function DoingBlock({ item, i }: { item: WhatIDoItem; i: number }) {
  return (
    <article
      className={`doing-block${i % 2 === 1 ? " flip" : ""}`}
      data-item={item.id}
    >
      <div className="doing-visual">
        {item.id === "develop" ? (
          <SkillRock />
        ) : (
          <div className="doing-placeholder" aria-hidden="true">
            <span>3D ELEMENT — TBD</span>
          </div>
        )}
      </div>
      <div className="doing-copy">
        <span className="doing-index">{item.index}</span>
        <h3 className="doing-title">{item.title}</h3>
        <p className="doing-lede">{item.lede}</p>
        <p className="doing-items">
          {item.items.map((s, j) => (
            <span key={s} className="doing-item">
              <span className="doing-item-n">{String(j + 1).padStart(2, "0")}</span>
              {s}
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}

export default function Skills() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(
    (_ctx, scope) => {
      if (reduced || !scope) return;
      // Judul dalam pin: enter split-char sekali (tanpa toggle — pin yang
      // menempelkan/menghilangkan judul secara natural). Setelah konten
      // masuk, judul mundur (autoAlpha 0.35) agar tak menutupi teks blok;
      // properti autoAlpha milik h2 vs yPercent milik .char — kepemilikan
      // terpisah, tak berebut dengan tween enter.
      gsap.from(".doing-title-sticky .char", {
        yPercent: 115,
        duration: 0.9,
        stagger: 0.035,
        ease: "power3.out",
        scrollTrigger: { trigger: scope, start: "top 75%", once: true },
      });
      // Judul mundur setelah konten masuk: digabung ke timeline pin agar
      // reversibel mengikuti scrub (posisi absolut 0.2, di tengah fase 1).
      // autoAlpha di h2; yPercent di .char — kepemilikan terpisah.
      const blocks = Array.from(scope.querySelectorAll<HTMLElement>(".doing-block"));
      const develop = scope.querySelector<HTMLElement>('.doing-block[data-item="develop"]');
      const design = scope.querySelector<HTMLElement>('.doing-block[data-item="design"]');
      // Pin parallax (2026-11-20): batu kecil→tengah→zoom-hilang,
      // Design masuk kanan BERSAMAAN. Satu timeline scrub 3 fase.
      // Judul di DALAM pin sebagai lapisan atas (ruling C — fixed/sticky
      // patah di dalam konten Smoother). Broadcast di LUAR pin menyusul
      // natural (pin-spacing GSAP memberi ruang). RM/mobile: cabang
      // reduced di atas sudah return — pin tak dibuat.
      if (develop && design) {
        const devVisual = develop.querySelector(".doing-visual");
        const devCopy = develop.querySelector(".doing-copy");
        const desVisual = design.querySelector(".doing-visual");
        const desCopy = design.querySelector(".doing-copy");
        const pinTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: scope.querySelector(".doing-pinned"),
            start: "top top",
            end: "+=200%",
            scrub: 0.6,
            pin: true,
            pinSpacing: true,
          },
        });
        // Judul mundur ke 0.35 setelah konten masuk (posisi 0.2, di
        // tengah fase 1; durasi 0.15 = selesai saat fase 1 selesai).
        // Fase 1 (0→0.35): batu 0.05→1 + Develop fade-in → tengah.
        // Judul ikut mundur (autoAlpha 0.35) agar tak menutupi teks —
        // properti milik h2, terpisah dari .char (enter) dan konten.
        pinTl.fromTo(
          ".doing-title-sticky",
          { autoAlpha: 1 },
          { autoAlpha: 0.18, duration: 0.15, immediateRender: false },
          0.2,
        );
        if (devVisual) {
          pinTl.fromTo(
            devVisual,
            { scale: 0.05, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.35, immediateRender: false },
            0,
          );
        }
        if (devCopy) {
          pinTl.fromTo(
            devCopy,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, immediateRender: false },
            0,
          );
        }
        // Fase 2 (0.35→0.5): jeda baca (dummy tanpa perubahan visual).
        pinTl.to({}, { duration: 0.15 }, 0.35);
        // Fase 3 (0.5→1): Develop zoom-hilang BERSAMAAN Design masuk.
        if (devVisual) {
          pinTl.fromTo(
            devVisual,
            { scale: 1, opacity: 1 },
            { scale: 1.6, opacity: 0, duration: 0.5, immediateRender: false },
            0.5,
          );
        }
        if (devCopy) {
          pinTl.fromTo(
            devCopy,
            { y: 0, opacity: 1 },
            { y: -40, opacity: 0, duration: 0.5, immediateRender: false },
            0.5,
          );
        }
        if (desVisual) {
          pinTl.fromTo(
            desVisual,
            // Masuk dari kanan DALAM viewport (bukan 40vw — kepotong
            // overflow clip). Blok bertumpuk: geser relatif cukup.
            { x: "18vw", opacity: 0, scale: 1 },
            { x: "0vw", opacity: 1, scale: 1, duration: 0.5, immediateRender: false },
            0.5,
          );
        }
        if (desCopy) {
          pinTl.fromTo(
            desCopy,
            { x: "-10vw", opacity: 0 },
            { x: "0vw", opacity: 1, duration: 0.5, immediateRender: false },
            0.5,
          );
        }
        return;
      }
      // Fallback: tanpa develop/design (tak terjadi) — animasi per-blok lama.
      blocks.forEach((block, i) => {
        const visual = block.querySelector(".doing-visual");
        const copy = block.querySelector(".doing-copy");
        if (visual) {
          gsap.fromTo(
            visual,
            { scale: 0.3, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              immediateRender: false,
              scrollTrigger: { trigger: block, start: "top 78%" },
            },
          );
        }
        if (copy) {
          gsap.fromTo(
            copy,
            { y: 44, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              immediateRender: false,
              scrollTrigger: { trigger: block, start: "top 78%" },
            },
          );
        }
        // Exit scrub hanya blok 1–2 (blok 3 = ujung, tak perlu exit).
        if (i < blocks.length - 1) {
          gsap.fromTo(
            block,
            { scale: 1, opacity: 1 },
            {
              scale: 1.35,
              opacity: 0,
              ease: "none",
              duration: 1,
              immediateRender: false,
              scrollTrigger: {
                trigger: block,
                start: "center 40%",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        }
      });
    },
    [reduced],
  );

  return (
    <section ref={ref} className="section skills" id="skills" aria-label="What I do">
        <div className="section-inner">
        <div className="doing-list">
          <div className="doing-pinned">
            {/* Judul lapisan atas pin (ruling C): di luar zoom, tak tertutup batu. */}
            <h2 className="doing-title-sticky display" aria-label="What I Do">
              <span className="line">
                <span className="line-inner">
                  <SplitChars text="What I Do" />
                </span>
              </span>
            </h2>
            {whatIDo
              .filter((item) => item.id !== "broadcast")
              .map((item, i) => (
                <DoingBlock key={item.id} item={item} i={i} />
              ))}
          </div>
          {whatIDo
            .filter((item) => item.id === "broadcast")
            .map((item) => (
              <div className="doing-after" key={item.id}>
                <DoingBlock item={item} i={2} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
