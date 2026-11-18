import { journey } from "../content";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import JourneyFlightPath from "./JourneyFlightPath";
import "./Journey.css";

/* Flight path: satu garis vertikal yang menggambar dirinya sendiri
   seiring scroll, dengan node koordinat waktu per entri. */

export default function Journey() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(() => {
    if (reduced) return;

    gsap.utils.toArray<HTMLElement>(".journey-entry").forEach((el) => {
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
    <section ref={ref} className="section journey" id="journey" aria-label="Experience and education">
      <div className="section-inner">
        <p className="section-tag reveal">04 // Journey</p>
        <div className="journey-head">
          <h2 className="display reveal">
            A log of <em>distance travelled.</em>
          </h2>
          <p className="lede reveal">
            Education, work, and waypoints — ordered like a flight log. Readable first, decorative
            second.
          </p>
        </div>

        <div className="journey-track">
          {/* Elemen J: rel lengkung + marker scrub; stop klik → entri. */}
          <JourneyFlightPath ids={journey.map((j) => `journey-${j.coord}`)} />

          {journey.map((j) => (
            <article key={j.coord} id={`journey-${j.coord}`} className="journey-entry">
              <span className="journey-node" aria-hidden="true" />
              <div className="journey-when">
                <p className="journey-period">{j.period}</p>
                <p className="journey-coord">{j.coord}</p>
              </div>
              <div className="journey-what">
                <h3>{j.title}</h3>
                <p className="journey-org">{j.org}</p>
                <p className="journey-detail">{j.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
