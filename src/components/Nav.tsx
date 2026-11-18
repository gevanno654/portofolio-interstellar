import { useState } from "react";
import { site } from "../content";
import "./Nav.css";

const LINKS = [
  { n: "01", label: "Signal", href: "#about" },
  { n: "02", label: "Systems", href: "#skills" },
  { n: "03", label: "Discoveries", href: "#projects" },
  { n: "04", label: "Journey", href: "#journey" },
  { n: "05", label: "Beyond", href: "#contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <a href="#top" className="nav-mark">
        <span className="nav-mark-init">{site.initials}</span>
        <span className="nav-mark-sub">BTEH</span>
      </a>

      <nav className="nav-links" aria-label="Sections">
        {LINKS.map((l) => (
          <a key={l.n} href={l.href} className="nav-link">
            <span className="nav-link-n">{l.n}</span>
            {l.label}
          </a>
        ))}
      </nav>

      <button
        className="nav-burger"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>

      <div className={`nav-overlay ${open ? "is-open" : ""}`}>
        {LINKS.map((l, i) => (
          <a
            key={l.n}
            href={l.href}
            className="nav-overlay-link"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
          >
            <span className="nav-overlay-n">{l.n}</span>
            {l.label}
          </a>
        ))}
        <p className="nav-overlay-foot">{site.availability}</p>
      </div>
    </header>
  );
}
