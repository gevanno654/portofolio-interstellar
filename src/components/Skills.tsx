import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import { whatIDo } from "../content";
import SkillRock from "./SkillRock";
import "./Skills.css";

/* What I Do: 3 blok alternating (Develop batu 3D kiri/teks kanan;
   Design cermin; Broadcast kiri/teks kanan).
   Masuk: grow 0.3→1 per blok. Exit blok 1–2: zoom 1→1.35 + fade, scrub
   reversibel (pola exit About: scrub 0.6 / ease none / fromTo +
   immediateRender:false). RM → statis penuh, tanpa trigger. */

export default function Skills() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(
    (_ctx, scope) => {
      if (reduced || !scope) return;
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
        <p className="section-tag">02 // Capabilities</p>

        <div className="skills-head">
          <h2 className="display">
            What I <em>Do</em>
          </h2>
          <p className="lede">
            Three disciplines, one orbit — each with its own instrument. Scroll on: the current
            instrument grows out of view as the next one takes its place.
          </p>
        </div>

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
