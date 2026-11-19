import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import { whatIDo } from "../content";
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

export default function Skills() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(
    (_ctx, scope) => {
      if (reduced || !scope) return;
      // Masuk judul: split-char naik dari mask (pola intro Hero:
      // yPercent 115, stagger 0.035, sekali via once:true).
      gsap.from(".doing-title-sticky .char", {
        yPercent: 115,
        duration: 0.9,
        stagger: 0.035,
        ease: "power3.out",
        scrollTrigger: { trigger: scope.querySelector("#skills") ?? scope, start: "top 75%", once: true },
      });
      const blocks = Array.from(scope.querySelectorAll<HTMLElement>(".doing-block"));
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
        <h2 className="doing-title-sticky display" aria-label="What I Do">
          <span className="line">
            <span className="line-inner">
              <SplitChars text="What I Do" />
            </span>
          </span>
        </h2>

        <div className="doing-list">
          {whatIDo.map((item, i) => (
            <article
              key={item.id}
              className={`doing-block${i % 2 === 1 ? " flip" : ""}`}
              data-item={item.id}
            >
              <div className="doing-visual">
                {i === 0 ? (
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
          ))}
        </div>
      </div>
    </section>
  );
}
