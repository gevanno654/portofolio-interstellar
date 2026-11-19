import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { createSpaceRock, type RockHandle } from "../three/spaceRock";
import "./SkillRock.css";

/* Wrapper canvas batu Develop: mount spaceRock, dispose saat unmount.
   WebGL gagal → fallback CSS radial-gradient + kawah. RM → frozen 1 frame. */

export default function SkillRock({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let handle: RockHandle | null = null;
    try {
      handle = createSpaceRock(host, { frozen: reduced });
    } catch {
      handle = null;
    }
    const ok = handle?.ok === true;
    host.dataset.rock = ok ? "webgl" : "fallback";
    (window as unknown as { __rockOk?: boolean }).__rockOk = ok;
    return () => {
      try {
        handle?.dispose();
      } catch {
        /* abaikan */
      }
    };
  }, [reduced]);

  return (
    <div className={`rock-stage ${className}`.trim()}>
      <div ref={hostRef} className="rock-canvas" aria-hidden="true" />
      <div className="rock-fallback" aria-hidden="true" />
    </div>
  );
}
