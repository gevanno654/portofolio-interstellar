import { skillGroups } from "../content";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import SkillsConstellation from "./SkillsConstellation";
import "./Skills.css";

/* Skills sebagai modul konsol kapal: bukan kartu, bukan progress bar.
   Setiap modul = baris sistem bernomor dengan readout teks. */

export default function Skills() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(() => {
    if (reduced) return;
    gsap.utils.toArray<HTMLElement>(".skills .reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        },
      );
    });
  }, [reduced]);

  return (
    <section ref={ref} className="section skills" id="skills" aria-label="Skills">
      <div className="section-inner">
        <p className="section-tag reveal">02 // Navigation system</p>

        <div className="skills-head">
          <h2 className="display reveal">
            Ship <em>systems</em>, nominal.
          </h2>
          <p className="lede reveal">
            Capability read as instrumentation — grouped by system, no fabricated percentages. What
            matters is coverage and fluency, not a number.
          </p>
        </div>

        {/* Elemen G: peta konstelasi interaktif (SVG radial statis). */}
        <SkillsConstellation />

        <div className="sys-list" role="list">
          {skillGroups.map((g) => (
            <article key={g.id} className="sys reveal" role="listitem">
              <header className="sys-head">
                <span className="sys-index">{g.index}</span>
                <h3 className="sys-title">{g.title}</h3>
                <span className="sys-status" aria-label="System nominal">
                  <span className="sys-status-dot" aria-hidden="true" />
                  NOMINAL
                </span>
              </header>
              <p className="sys-items">
                {g.items.map((item, i) => (
                  <span key={item} className="sys-item">
                    <span className="sys-item-n">{String(i + 1).padStart(2, "0")}</span>
                    {item}
                  </span>
                ))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
