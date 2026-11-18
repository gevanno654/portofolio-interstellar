import { closing, site, socials } from "../content";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import "./Contact.css";

export default function Contact() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>((_ctx, scope) => {
    if (reduced) return;
    gsap.utils.toArray<HTMLElement>(".contact .reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        },
      );
    });
    // Cahaya horizon: muncul paling lambat
    gsap.fromTo(
      ".horizon",
      { opacity: 0, scaleX: 0.6 },
      {
        opacity: 1,
        scaleX: 1,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: { trigger: scope ?? undefined, start: "top 70%" },
      },
    );
  }, [reduced]);

  return (
    <section ref={ref} className="section contact" id="contact" aria-label="Contact">
      <div className="section-inner contact-inner">
        <p className="section-tag reveal">{closing.tag}</p>
        <h2 className="display contact-headline reveal">{closing.headline}</h2>
        <p className="lede reveal">{closing.note}</p>

        <a className="contact-email display reveal" href={`mailto:${site.email}`}>
          {site.email}
        </a>

        <ul className="contact-socials reveal">
          {socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" className="u-link">
                {s.label} <span className="contact-handle">{s.handle}</span> ↗
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="horizon" aria-hidden="true">
        <span className="horizon-line" />
      </div>
    </section>
  );
}
