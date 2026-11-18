import { site } from "../content";
import "./Footer.css";

const YEAR = new Date().getFullYear();

export default function Footer() {
  const year = YEAR;
  return (
    <footer className="footer">
      <p>
        © {year} {site.name} — Beyond the Event Horizon
      </p>
      <a href="#top" className="u-link">
        Back to surface ↑
      </a>
    </footer>
  );
}
