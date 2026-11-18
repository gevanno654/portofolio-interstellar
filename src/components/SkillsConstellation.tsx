import { useState } from "react";
import { skillGroups } from "../content";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import "./SkillsConstellation.css";

/* Elemen G — peta konstelasi interaktif: node = skill, edge = relasi se-kategori.
   Layout radial STATIS precomputed di bawah (tanpa force-layout runtime).
   Budget: 17 node + 12 edge (≤30 node / ≤40 edge → SVG, bukan canvas).
   Hover/fokus node → tooltip + highlight edge. Node <g tabindex> = fokus keyboard.
   RM → semua node tampil langsung + daftar <ul> statis. Tanpa foto/figur. */

type Node = { id: string; label: string; group: string; x: number; y: number };
type Edge = { a: string; b: string };

const W = 600;
const H = 420;

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  skillGroups.forEach((g, gi) => {
    const center = (gi / skillGroups.length) * Math.PI * 2 - Math.PI / 2;
    g.items.forEach((label, j) => {
      const ang = center + (j - (g.items.length - 1) / 2) * 0.3;
      const id = `${g.id}-${j}`;
      nodes.push({
        id,
        label,
        group: g.title,
        x: 300 + 215 * Math.cos(ang),
        y: 210 + 150 * Math.sin(ang),
      });
      if (j > 0) edges.push({ a: `${g.id}-${j - 1}`, b: id });
    });
  });
  return { nodes, edges };
}

// Precomputed sekali di module — statis, bukan force-layout.
const { nodes: NODES, edges: EDGES } = buildGraph();
const BY_ID = new Map(NODES.map((n) => [n.id, n]));

export default function SkillsConstellation() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const tip = active ? BY_ID.get(active) : undefined;

  const ref = useGsapScope<HTMLElement>((_ctx, scope) => {
    if (reduced || !scope) return;
    // Reveal per-node stagger via ScrollTrigger.batch.
    const nodes = Array.from(scope.querySelectorAll(".const-node"));
    gsap.set(nodes, { opacity: 0, scale: 0, transformOrigin: "center" });
    ScrollTrigger.batch(nodes, {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", stagger: 0.05 }),
    });
  }, [reduced]);

  return (
    <figure ref={ref} className="constellation">
      <svg
        className="const-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label="Skill constellation map — tab through nodes for details"
      >
        {EDGES.map((e) => {
          const a = BY_ID.get(e.a);
          const b = BY_ID.get(e.b);
          if (!a || !b) return null;
          const hot = active === e.a || active === e.b;
          return (
            <line
              key={`${e.a}-${e.b}`}
              className={`const-edge${hot ? " active" : ""}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          );
        })}
        {NODES.map((n) => (
          <g
            key={n.id}
            className={`const-node${active === n.id ? " active" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${n.label} — ${n.group}`}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(n.id)}
            onBlur={() => setActive(null)}
          >
            <title>{`${n.label} — ${n.group}`}</title>
            <circle className="const-ring" cx={n.x} cy={n.y} r={9} />
            <circle className="const-dot" cx={n.x} cy={n.y} r={3} />
            <text className="const-label" x={n.x} y={n.y + 24} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      {tip && (
        <div
          className="const-tip"
          aria-hidden="true"
          style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%` }}
        >
          <strong>{tip.label}</strong>
          <span>{tip.group}</span>
        </div>
      )}
      {/* Fallback progresif: daftar teks biasa bila animasi/RM mati. */}
      <ul className="const-list" aria-label="Skills by category">
        {skillGroups.map((g) => (
          <li key={g.id} className="const-row">
            <span className="const-group">
              {g.index} — {g.title}
            </span>
            <span className="const-items">{g.items.join(" / ")}</span>
          </li>
        ))}
      </ul>
      <figcaption className="const-caption">
        Peta konstelasi abstrak dari 17 skill dalam 5 sistem — dekorasi geometris, bukan foto atau
        figur.
      </figcaption>
    </figure>
  );
}
