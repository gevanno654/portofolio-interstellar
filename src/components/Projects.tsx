import { projects, type Project } from "../content";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/gsap";
import ProjectCard from "./ProjectCard";
import type { WormholeRequest } from "./WormholeTransition";
import "./Projects.css";

/* Tiga pola layout bergantian — anti kartu seragam:
   bleed (full-bleed image + overlay) · split (7:5 parallax) · index (daftar editorial) */

/* Thumb diklik → wormhole (I): overlay hisap dari titik klik, navigasi di akhir.
   - preventDefault: tidak ada navigasi native (thumb adalah <button>).
   - TIDAK pre-open tab: window.open sinkron mencuri fokus sehingga overlay mati.
     Navigasi dilakukan di onDone (±600ms, masih dalam transient activation).
   - Origin klik (x,y 0..1) diteruskan agar lubang muncul di posisi kursor.
   - Debounce: slot busy → klik diabaikan.
   Tombol penuh untuk a11y — tanpa foto/wajah, hanya bingkai tilt. */
function openWormhole(p: Project, e: { preventDefault: () => void; clientX?: number; clientY?: number }) {
  e.preventDefault();
  try {
    const w = window as unknown as {
      __wormholeOpen?: (d: WormholeRequest) => boolean;
      __wormholeBusy?: boolean;
    };
    if (w.__wormholeBusy) return;
    const url = p.github ?? p.live ?? "#projects";
    const external = /^https?:/i.test(url);
    let x = 0.5;
    let y = 0.5;
    if (typeof e.clientX === "number" && typeof e.clientY === "number" && (e.clientX || e.clientY)) {
      x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      y = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
    }
    w.__wormholeOpen?.({ slug: p.slug, title: p.title, url, external, x, y });
  } catch {
    /* abaikan */
  }
}

function Thumb({ p }: { p: Project }) {
  return (
    <button type="button" className="thumb-btn" onClick={(e) => openWormhole(p, e)} aria-label={`Open ${p.title}`}>
      {/* Elemen H: bingkai tilt 3D (compositor-only) di sekitar thumbnail. */}
      <ProjectCard>
        <div className={`thumb thumb-${p.layout}`} role="img" aria-label={`${p.title} preview placeholder`}>
          <span className="thumb-grid" aria-hidden="true" />
          <span className="thumb-index">{p.index}</span>
          <span className="thumb-note">thumbnail — 16:10 · replace me</span>
        </div>
      </ProjectCard>
    </button>
  );
}

function Meta({ p }: { p: Project }) {
  return (
    <div className="proj-meta">
      <p className="proj-index">{p.index} — {p.year}</p>
      <h3 className="proj-title display">{p.title}</h3>
      <p className="proj-desc">{p.description}</p>
      <p className="proj-stack">
        {p.stack.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </p>
      <p className="proj-links">
        {p.github && (
          <a className="u-link" href={p.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        )}
        {p.live && (
          <a className="u-link" href={p.live} target="_blank" rel="noreferrer">
            Live ↗
          </a>
        )}
      </p>
    </div>
  );
}

export default function Projects() {
  const reduced = useReducedMotion();

  const ref = useGsapScope<HTMLElement>(() => {
    if (reduced) return;

    // Reveal editorial per proyek
    gsap.utils.toArray<HTMLElement>(".proj").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%" },
        },
      );
    });

    // Image parallax: thumbnail bergerak lebih lambat dari scroll (±5%)
    gsap.utils.toArray<HTMLElement>(".thumb-inner, .thumb").forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: el.closest(".proj") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    // Parallax depth per kartu: data-tilt-speed → yPercent ±5 scrub.
    // (data-speed TANPA prefix = milik Smoother effects; JANGAN pakai
    // di sini — Smoother menulis transform yang sama = perebutan.)
    gsap.utils.toArray<HTMLElement>(".tilt-scene").forEach((el) => {
      const speed = Number(el.dataset.tiltSpeed ?? 5);
      gsap.fromTo(
        el,
        { yPercent: -speed },
        {
          yPercent: speed,
          ease: "none",
          scrollTrigger: { trigger: el.closest(".proj") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
  }, [reduced]);

  return (
    <section ref={ref} className="section projects" id="projects" aria-label="Projects">
      <div className="section-inner">
        <p className="section-tag reveal">03 // Discoveries</p>
        <div className="projects-head">
          <h2 className="display reveal">
            Objects found in the <em>deep field.</em>
          </h2>
          <p className="lede reveal">
            Selected work, each given its own frame. Replace every placeholder below with the real
            thing — the layouts already know what to do.
          </p>
        </div>

        {projects.map((p) => (
          <article key={p.slug} id={`proj-${p.slug}`} className={`proj proj-${p.layout}`}>
            {p.layout === "bleed" && (
              <>
                <Thumb p={p} />
                <Meta p={p} />
              </>
            )}
            {p.layout === "split" && (
              <>
                <Meta p={p} />
                <Thumb p={p} />
              </>
            )}
            {p.layout === "index" && (
              <>
                <a href={p.github ?? "#projects"} className="index-row">
                  <span className="index-n">{p.index}</span>
                  <span className="index-title display">{p.title}</span>
                  <span className="index-year">{p.year}</span>
                </a>
                <div className="index-detail">
                  <p className="proj-desc">{p.description}</p>
                  <p className="proj-stack">
                    {p.stack.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </p>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
