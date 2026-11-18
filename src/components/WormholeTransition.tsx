import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../lib/gsap";
import "./WormholeTransition.css";

/* Elemen I — transisi wormhole antar halaman proyek (overlay full-viewport).
   Satu arah 2500ms: lingkaran hitam + cincin sprinkle biru miring (PERCOBAAN,
   gampang dikembalikan) — ratusan butir berkumpul di bidang miring, bukan
   garis; lubang jelas di awal, membesar perlahan 15% ke 20%;
   bintang warna-warni jatuh radial dan MENGHITAM di bibir. Tanpa elemen
   berputar. Navigasi di onDone (akhir). GL shader quad (1 draw) bila GPU
   bebas; fallback 2D bila WebGL gagal/sibuk. Esc/tombol = cut LANGSUNG
   (batal, tanpa navigasi, tanpa transisi keluar). inert + focus trap; fokus
   dikembalikan. Elemen C dimatikan via onToggle(true/false).
   RM → cut + navigasi langsung. */

export const WORMHOLE_MS = 2500;
/** Hold setelah hisap selesai, sebelum navigasi (0 = langsung). */
export const WORMHOLE_HOLD_MS = 0;

export type WormholeRequest = {
  slug: string;
  title: string;
  url: string;
  /** true = tautan http(s) eksternal → dibuka di tab baru. */
  external: boolean;
  /** Origin klik 0..1 (viewport) — lubang muncul di posisi kursor. */
  x: number;
  y: number;
};

type Props = {
  active: boolean;
  label: string;
  ox: number;
  oy: number;
  reduced: boolean;
  onToggle: (on: boolean) => void;
  /** Dipanggil di AKHIR animasi maju → navigasi terjadi di sini. */
  onDone: () => void;
  onCancel: () => void;
};

const WORM_VERT = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const WORM_FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform vec2 uCenter; // uv titik klik (y dari bawah)
  uniform float uT;     // 0 = layar utuh → 1 = tertelan penuh (2.5 dtk)
  uniform float uTime;   // detik sejak overlay dibuka (twinkle ambient)
  // Hash deterministik — tanpa texture, tanpa random per-frame.
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  // Palet warna-warni bintang.
  vec3 starColor(float h) {
    vec3 c = vec3(1.0, 0.92, 0.78);
    c = mix(c, vec3(0.55, 0.85, 1.0), step(0.2, h));
    c = mix(c, vec3(1.0, 0.55, 0.85), step(0.4, h));
    c = mix(c, vec3(0.65, 1.0, 0.6), step(0.6, h));
    c = mix(c, vec3(0.75, 0.65, 1.0), step(0.8, h));
    return c;
  }
  // Noise untuk twinkle bintang (tetap dipakai).
  float bhHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float bhNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = bhHash(i);
    float b = bhHash(i + vec2(1.0, 0.0));
    float c = bhHash(i + vec2(0.0, 1.0));
    float d = bhHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float bhFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 2; i++) {
      v += a * bhNoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 q = vec2((uv.x - uCenter.x) * aspect, uv.y - uCenter.y);
    float r = length(q) + 0.00001;
    float t = uTime;

    // --- Lingkaran biasa: bayangan bulat + rim tipis + halo lembut.
    // Tanpa cakram/pita/arc/doppler — bersih, tidak bisa kacau.
    vec2 d = q;

    // Lubang jelas di awal, membesar perlahan; TIDAK menelan penuh.
    float t2 = pow(clamp(uT, 0.0, 1.0), 1.6);
    float Rs = mix(0.27, 0.36, smoothstep(0.0, 1.0, t2)) * 0.9;
    float re = Rs; // alias — dipakai loop bintang jatuh di bawah

    // Bayangan: lingkaran penuh.
    float screenR = length(d) + 0.00001;
    float shadow = 1.0 - smoothstep(Rs * 0.97, Rs * 1.03, screenR);

    // --- Latar: starfield statis 3 lapis warna-warni + twinkle — ramai & jelas.
    vec3 back = vec3(0.0);
    vec2 g1 = q * 90.0;
    vec2 cc1 = floor(g1);
    vec2 f1 = fract(g1) - 0.5;
    float on1 = step(0.978, hash21(cc1));
    float m1 = (1.0 - smoothstep(0.06, 0.34, length(f1))) * on1;
    back += starColor(hash21(cc1 + 3.0)) * m1 * (0.75 + 0.25 * sin(t * 3.0 + hash21(cc1) * 50.0)) * 1.1;
    vec2 g2 = q * 38.0 + 7.0;
    vec2 cc2 = floor(g2);
    vec2 f2 = fract(g2) - 0.5;
    float on2 = step(0.962, hash21(cc2));
    float m2 = (1.0 - smoothstep(0.07, 0.38, length(f2))) * on2;
    back += starColor(hash21(cc2 + 9.0)) * m2 * (0.75 + 0.25 * sin(t * 2.0 + hash21(cc2) * 40.0)) * 1.1;
    vec2 g3 = q * 160.0 + 31.0;
    vec2 cc3 = floor(g3);
    vec2 f3 = fract(g3) - 0.5;
    float on3 = step(0.975, hash21(cc3));
    float m3 = (1.0 - smoothstep(0.05, 0.30, length(f3))) * on3;
    back += starColor(hash21(cc3 + 5.0)) * m3 * 1.2;

    // --- Sprinkle: 150 loop × 2 = ~300 bintang warna-warni jatuh RADIAL.
    // KECIL & BULAT: ps besar (36→50) = titik kecil tajam, bukan blob;
    // tiap iterasi gambar 2 titik (kembaran offset sudut) → ramai tanpa
    // tambah loop (hemat: hash dipakai ulang). Terang flat, boost jauh
    // kecil saja agar tidak kalah starfield tapi tidak mendominasi.
    // Sudut TETAP; hanya radius mengecil mengikuti uT; menghitam di bibir.
    vec3 fall = vec3(0.0);
    for (int i = 0; i < 150; i++) {
      float fi = float(i);
      float a1 = hash21(vec2(fi, 7.0));
      float a2 = hash21(vec2(fi, 13.0));
      float a3 = hash21(vec2(fi, 29.0));
      float r0 = 0.12 + a1 * 1.35;
      float spd = 0.55 + a2 * 0.45;
      float rr = r0 * (1.0 - uT * spd);
      float aa = a2 * 6.2831;
      float elong = 1.0 + uT * spd * 6.0 * exp(-rr * 2.0);
      float ps = mix(36.0, 50.0, exp(-rr * 2.0));
      float tw2 = 0.75 + 0.25 * sin(t * 4.0 + a1 * 40.0 + fi);
      float rrF = max(rr, 0.0001);
      float inside = 1.0 - smoothstep(re * 0.92, re * 1.02, rr);
      float bright = (1.0 - inside) * tw2 * (1.1 + rr * 0.3);
      // Titik 1.
      vec2 sp = vec2(cos(aa), sin(aa)) * rr;
      vec2 dv = q - sp;
      vec2 rdir = sp / (length(sp) + 0.0001);
      vec2 tdir = vec2(-rdir.y, rdir.x);
      float dd = length(vec2(abs(dot(dv, rdir)) * elong * ps, abs(dot(dv, tdir)) * ps * 2.0));
      float m = (1.0 - smoothstep(0.12, 1.0, dd)) * smoothstep(0.0, 0.04, rrF);
      fall += starColor(a3) * m * bright;
      // Titik 2 (kembaran): sudut +0.35 rad, radius 0.7× + offset — hash sama.
      float aa2 = aa + 0.35;
      float rr2 = rr * 0.7 + 0.08;
      vec2 sp2 = vec2(cos(aa2), sin(aa2)) * rr2;
      vec2 dv2 = q - sp2;
      vec2 rdir2 = sp2 / (length(sp2) + 0.0001);
      vec2 tdir2 = vec2(-rdir2.y, rdir2.x);
      float dd2 = length(vec2(abs(dot(dv2, rdir2)) * elong * ps, abs(dot(dv2, tdir2)) * ps * 2.0));
      float m2 = (1.0 - smoothstep(0.12, 1.0, dd2)) * smoothstep(0.0, 0.04, rr2);
      float inside2 = 1.0 - smoothstep(re * 0.92, re * 1.02, rr2);
      fall += starColor(a3) * m2 * (1.0 - inside2) * tw2 * 1.1;
    }

    // --- Lingkaran + cincin debu: TANPA GARIS — hanya halo lembut + debu.
    float halo = exp(-abs(screenR - Rs * 1.35) * 4.0) * 0.5;
    // --- Cincin sprinkle PADAT: ribuan butir biru di bidang miring.
    // Terlihat menggaris karena sangat padat; BERPUTAR PERLAHAN (rotasi
    // sudut +t*0.3, ~17°/detik) + merapat sedikit (gather) + ikut Rs.
    // Murah: 2 lapis sel-hash prosedural (bukan loop ratusan bintang).
    vec3 ringCol = vec3(0.70, 0.78, 1.0); // sama seperti siluet biru (fallback)
    float tiltA = -0.32; // ~-18 derajat
    float tiltC = cos(tiltA);
    float tiltS = sin(tiltA);
    vec2 drT = vec2(tiltC * d.x - tiltS * d.y, tiltS * d.x + tiltC * d.y);
    float rp0 = length(vec2(drT.x, drT.y / 0.32)) + 0.00001;
    float bandMain = smoothstep(Rs * 1.28, Rs * 1.45, rp0)
                   * (1.0 - smoothstep(Rs * 1.90, Rs * 2.10, rp0));
    float bandOuter = smoothstep(Rs * 2.00, Rs * 2.12, rp0)
                    * (1.0 - smoothstep(Rs * 2.28, Rs * 2.48, rp0));
    float ringMask = bandMain * 1.0 + bandOuter * 0.7;
    // Putar ala cosmicDust: DIFERENSIAL (dalam lebih cepat, t/r) bukan rigid.
    float diffA = t * 0.35 / max(rp0 / (Rs * 1.8), 0.45);
    float rotC = cos(diffA);
    float rotS = sin(diffA);
    vec2 rCirc = vec2(drT.x, drT.y / 0.32);
    vec2 rRot = vec2(rotC * rCirc.x - rotS * rCirc.y, rotS * rCirc.x + rotC * rCirc.y);
    // Debu ala cosmicDust: alas berawan + 2 lapis butir, SPIRAL TERSedot
    // (r menyusut + theta diferensial t/r, seperti update() cosmicDust:
    //  r -= (0.006+vel*K)*dt, theta += dt*spin/r) — bukan rotasi rigid.
    // Butir padat (ambang rendah ≈ kontinu) + menyatu menggaris, biru.
    // HEMAT: 2 lapis saja + fbm sekali — 5 lapis terbukti bikin lag.
    float dustBase = bhFbm(vec2(rRot.x * 14.0 + rRot.y * 5.0, rRot.y * 34.0 - t * 0.22));
    // Lapis rapat halus + lapis sedang — STREAKS BEREKOR (bukan bulat).
    // Elongasi tangensial: offset sel diproyeksikan ke radial/tangensial,
    // lalu sumbu tangensial dikecilkan ×0.20 → streak ~5× searah gerak.
    // PADAT-MAKS TANPA LAG: hanya konstanta (panjang/tebal/bobot),
    // tanpa lapis/instruksi baru.
    vec2 rdirP = rRot / (length(rRot) + 0.0001);
    vec2 tdirP = vec2(-rdirP.y, rdirP.x);
    vec2 gA = rRot * 420.0;
    vec2 ccA = floor(gA);
    vec2 ffA = fract(gA) - 0.5;
    vec2 offA = vec2(hash21(ccA + 1.7), hash21(ccA + 9.3)) - 0.5;
    vec2 owA = ffA - offA * 0.7;
    float mA = 1.0 - smoothstep(0.08, 0.90, length(vec2(dot(owA, rdirP), dot(owA, tdirP) * 0.20)));
    vec2 gB = rRot * 150.0 + 41.0;
    vec2 ccB = floor(gB);
    vec2 ffB = fract(gB) - 0.5;
    vec2 offB = vec2(hash21(ccB + 4.7), hash21(ccB + 2.2)) - 0.5;
    vec2 owB = ffB - offB * 0.7;
    float mB = 1.0 - smoothstep(0.08, 0.90, length(vec2(dot(owB, rdirP), dot(owB, tdirP) * 0.20)));
    float twA = 0.7 + 0.3 * sin(t * 3.5 + hash21(ccA + 4.4) * 40.0);
    float twB = 0.7 + 0.3 * sin(t * 3.5 + hash21(ccB + 6.6) * 40.0);
    float gather = 1.0 - uT * 0.06;
    float ringM = (dustBase * 2.6 + mA * twA * 1.4 + mB * twB * 1.5) * ringMask * gather;
    vec3 scolA = mix(vec3(0.70, 0.78, 1.0), vec3(1.0), step(0.72, hash21(ccA + 8.8)) * 0.7);
    float isFront = 1.0 - smoothstep(-0.008, 0.008, drT.y);
    vec3 ringBack = scolA * ringM * (1.0 - isFront) * 0.9;
    vec3 ringFront = scolA * ringM * isFront * 1.1;
    // (ringCol dipakai fallback 2D; GL memakai scolA per-sel.)

    // --- Komposit: belakang → bayangan → debu depan (terokultasi) + halo.
    // TANPA RIM, TANPA goresan sisi (dikembalikan per permintaan).
    vec3 col = vec3(0.015, 0.02, 0.042) + back * (1.0 - shadow) + fall * (1.0 - shadow);
    col += ringBack * (1.0 - shadow);                        // debu jauh
    col = mix(col, vec3(0.0), shadow);                   // bayangan menutupi
    col += ringFront * (1.0 - shadow);                   // depan terokultasi
    col += vec3(0.55, 0.5, 0.85) * halo * 0.5;            // halo ungu lembut
    col = col / (1.0 + col * 0.6);
    col *= 1.25;
    float vig = smoothstep(0.3, 1.2, length(vec2((uv.x - 0.5) * aspect, uv.y - 0.5)));
    col *= mix(1.0, 0.7, vig);
    col += (hash21(uv * uRes * 0.5 + t * 60.0) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function WormholeTransition({ active, label, ox, oy, reduced, onToggle, onDone, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  const cancelRef = useRef(onCancel);
  const originRef = useRef({ x: ox, y: oy });
  const runRef = useRef(0);
  const holdRef = useRef(0);
  const fbStopRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    doneRef.current = onDone;
    cancelRef.current = onCancel;
    originRef.current = { x: ox, y: oy };
  });

  const play = useCallback(
    (reverse: boolean) => {
      const overlay = overlayRef.current;
      if (!overlay) {
        // Overlay belum mount — tetap batalkan agar tidak macet.
        if (reverse) cancelRef.current();
        return;
      }
      // CANCEL (Esc/tombol): cut LANGSUNG tanpa transisi keluar.
      // Bunuh loop/tween/timer lalu unmount via onCancel — tanpa animasi mundur.
      if (reverse) {
        runRef.current += 1;
        window.clearTimeout(holdRef.current);
        fbStopRef.current?.();
        fbStopRef.current = null;
        gsap.killTweensOf(overlay);
        cancelRef.current();
        return;
      }
      const myRun = runRef.current;
      const done = () => {
        if (myRun !== runRef.current) return;
        if (WORMHOLE_HOLD_MS > 0) {
          // Hold layar penuh setelah hisap selesai, baru navigasi.
          holdRef.current = window.setTimeout(() => {
            if (myRun !== runRef.current) return;
            doneRef.current();
          }, WORMHOLE_HOLD_MS);
        } else {
          doneRef.current();
        }
      };
      const o = originRef.current;
      if (reduced) {
        // RM → cut langsung + navigasi langsung (tanpa hold).
        gsap.set(overlay, { opacity: 1, clipPath: "none" });
        if (myRun !== runRef.current) return;
        doneRef.current();
        return;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const useGL = runGL(canvas, done, myRun, runRef, o.x, o.y);
        if (useGL) {
          // Overlay langsung opaque penuh — lubang sudah jelas di frame pertama.
          gsap.set(overlay, { opacity: 1, clipPath: "none" });
          return;
        }
      }
      // Fallback 2D canvas: lubang membesar perlahan + bintang warna-warni
      // jatuh radial dari titik klik (tanpa putaran). Lubang SUDAH JELAS di
      // frame pertama, tanpa clip-path lingkaran.
      const fbCanvas = overlay.querySelector<HTMLCanvasElement>(".wormhole-fb");
      if (fbCanvas) {
        overlay.classList.add("wormhole-css");
        overlay.style.setProperty("--wx", `${(o.x * 100).toFixed(1)}%`);
        overlay.style.setProperty("--wy", `${(o.y * 100).toFixed(1)}%`);
        gsap.set(overlay, { opacity: 1, clipPath: "none" });
        const stop = runFallback2D(fbCanvas, done, myRun, runRef, o.x, o.y);
        if (stop) {
          // Simpan stop agar loop mati saat Esc/unmount.
          fbStopRef.current = stop;
          return;
        }
      }
      // Fallback terakhir (tanpa canvas): overlay penuh statis + tunggu.
      overlay.classList.add("wormhole-css");
      overlay.style.setProperty("--wx", `${(o.x * 100).toFixed(1)}%`);
      overlay.style.setProperty("--wy", `${(o.y * 100).toFixed(1)}%`);
      gsap.set(overlay, { opacity: 1, clipPath: "none" });
      gsap.delayedCall(2.4, done);
    },
    [reduced],
  );

  // Aktif: kunci debu (C), pasang inert + focus trap, kunci scroll, Esc.
  useEffect(() => {
    if (!active) return;
    try {
      (window as unknown as { __wormholeBusy?: boolean }).__wormholeBusy = true;
    } catch {
      /* abaikan */
    }
    onToggle(true);
    const overlay = overlayRef.current;
    const prevFocus = document.activeElement as HTMLElement | null;
    const main = document.querySelector("main");
    main?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    const box = overlay?.querySelector<HTMLElement>("[data-autofocus]");
    box?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      // Esc valid selama animasi (navigasi hanya terjadi di done/akhir).
      if (e.key === "Escape") {
        e.preventDefault();
        play(true);
        return;
      }
      // Focus trap: Tab tidak boleh keluar overlay.
      if (e.key === "Tab" && overlay) {
        const items = Array.from(
          overlay.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    play(false);

    return () => {
      runRef.current += 1;
      window.clearTimeout(holdRef.current);
      fbStopRef.current?.();
      fbStopRef.current = null;
      if (overlay) gsap.killTweensOf(overlay);
      document.removeEventListener("keydown", onKey, true);
      main?.removeAttribute("inert");
      document.body.style.overflow = "";
      onToggle(false);
      try {
        (window as unknown as { __wormholeBusy?: boolean }).__wormholeBusy = false;
      } catch {
        /* abaikan */
      }
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [active, onToggle, play]);

  if (!active) return null;
  return createPortal(
    <div
      ref={overlayRef}
      className="wormhole"
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${label}`}
    >
      <canvas ref={canvasRef} className="wormhole-canvas" aria-hidden="true" />
      <canvas className="wormhole-fb" aria-hidden="true" />
      <div className="wormhole-core" data-autofocus tabIndex={-1}>
        <p className="wormhole-title" key={label}>
          {label}
        </p>
        <p className="wormhole-pct" aria-hidden="true">
          <span className="wormhole-pct-fill" />
        </p>
        <button type="button" className="wormhole-abort" onClick={() => play(true)}>
          Cancel — Esc
        </button>
      </div>
    </div>,
    document.body,
  );
}

// Fallback 2D canvas (saat WebGL diblokir/gagal): animasi NYATA tanpa putaran.
// Lubang hitam SUDAH JELAS di frame pertama (r0), membesar perlahan 2.4 dtk;
// 90 bintang warna-warni jatuh radial dari tepi ke titik klik dan MENGHITAM
// (fade ke hitam) saat melewati bibir. Return stop() agar loop bisa dibunuh.
// Tanpa clip-path lingkaran — kanvas selalu fullscreen opaque.
function runFallback2D(
  canvas: HTMLCanvasElement,
  done: () => void,
  myRun: number,
  runRef: { current: number },
  _cxN: number,
  _cyN: number,
): (() => void) | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  const W = Math.floor(window.innerWidth * dpr);
  const H = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  // Fallback 2D: lubang SELALU DI TENGAH layar (bukan di titik klik —
  // teks TRANSIT/judul juga di tengah, jadi menyatu). Cakram proporsional
  // (tidak melebar keluar kanvas), tanpa arc terpisah.
  const cx = W / 2;
  const cy = H / 2;
  // Lubang 15% → 20% dari SETENGAH TINGGI layar: proporsional, tidak raksasa.
  const halfH = H / 2;
  const rStart = halfH * 0.52;
  const rEnd = halfH * 0.70;
  const DUR = 2500;
  const palette = ["#f5e6c8", "#8cd4ff", "#ff8cc6", "#9dff9d", "#b9a5ff", "#ffd27a", "#ffffff", "#ffe9a8"];
  // Bintang: sudut TETAP (tanpa putaran), radius awal acak, kecepatan jatuh acak.
  // 300 butir KECIL-BULAT (arc, bukan kotak): ramai tapi tidak kotak-kotak.
  // r0 relatif ke halfH supaya distribusi merata di seluruh layar.
  const stars = Array.from({ length: 300 }, (_, i) => {
    const a = ((i * 137.508) % 360) * (Math.PI / 180);
    return {
      ang: a,
      r0: halfH * (0.35 + ((i * 7919) % 100) / 100 * 1.9),
      spd: 0.45 + ((i * 377) % 100) / 100 * 0.5,
      size: (0.6 + ((i * 131) % 100) / 100 * 1.0) * dpr,
      col: palette[i % palette.length],
      tw: (((i * 173) % 100) / 100) * Math.PI * 2,
    };
  });
  let raf = 0;
  let dead = false;
  const t0 = performance.now();
  // Gerak diperlambat: pangkat 1.6 menahan laju di awal (perlahan), lalu
  // mengejar lembut di akhir — durasi tetap 2.5 dtk.
  const easeSlow = (p: number) => Math.pow(p * p * (3 - 2 * p), 1.6);
  const frame = () => {
    if (dead || myRun !== runRef.current) return;
    const now = performance.now();
    let p = (now - t0) / DUR;
    if (p >= 1) p = 1;
    const e = easeSlow(p);
    const hole = rStart + (rEnd - rStart) * e;
    // Latar deep-space.
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    // Bintang jatuh radial (tanpa putaran), menghitam di bibir.
    // KECIL-BULAT-RAMAI: arc solid (bukan fillRect kotak), ukuran kecil,
    // tanpa boost jauh — ramai dari jumlah, bukan ukuran. Tetap murah:
    // 300 arc kecil jauh lebih ringan dari 900+ gradien lama.
    for (const s of stars) {
      const rr = s.r0 * (1 - p * s.spd * 0.85);
      const fade = Math.max(0, Math.min(1, (rr - hole * 0.92) / (hole * 0.25 + 1)));
      if (fade <= 0) continue;
      const twk = 0.7 + 0.3 * Math.sin(now / 300 + s.tw);
      ctx.globalAlpha = fade * twk;
      ctx.fillStyle = s.col;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(s.ang) * rr, cy + Math.sin(s.ang) * rr, Math.max(s.size * 0.55, 0.5 * dpr), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Debu ala cosmicDust: ribuan butir halus + halo lembut. TANPA GARIS —
    // alas pita elips dihapus, hanya butir debu yang menyatu menggaris.
    // Urutan: halo + butir BELAKANG → bayangan → rim → DEPAN.
    const shR = hole * 0.72;
    const halo = ctx.createRadialGradient(cx, cy, shR * 0.5, cx, cy, shR * 1.8);
    halo.addColorStop(0, "rgba(0,0,0,0)");
    halo.addColorStop(0.5, "rgba(140,140,220,0.28)");
    halo.addColorStop(0.75, "rgba(110,100,190,0.12)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, shR * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Streak berekor: 1400 garis (murah) + dipadatkan via ekor PANJANG
    // & TEBAL (bukan tambah butir): ekor 2.6→3.6·sz, lebar 0.5→0.7·sz.
    // Hanya konstanta — tanpa objek/instruksi baru, tetap anti-lag.
    const ringSpots = Array.from({ length: 1400 }, (_, i) => ({
      aa: (((i * 137.508) % 360) * Math.PI) / 180,
      rr: 1.30 + Math.sqrt((((i * 7919) % 100) / 100)) * 1.18,
      sz: (1.4 + (((i * 131) % 100) / 100) * 1.8) * dpr,
      spin: 0.5 + (((i * 377) % 100) / 100),
      bright: ((i * 377) % 100) / 100,
      tw: (((i * 173) % 100) / 100) * Math.PI * 2,
    }));
    const paintRing = (front: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.32);
      const flat = 0.32;
      const gather = 1 - easeSlow(p) * 0.06;
      const tSec = now / 1000;
      ctx.lineCap = "round";
      for (const s of ringSpots) {
        // Spiral diferensial ala cosmicDust: theta += dt*spin/r (dalam cepat).
        const diff = (tSec * 0.35 * s.spin) / Math.max(s.rr / 1.8, 0.45);
        const aRot = s.aa + diff;
        const rx = Math.cos(aRot) * shR * s.rr * gather;
        const ry = Math.sin(aRot) * shR * s.rr * gather * flat;
        const isFront = ry > 0;
        if (isFront !== front) continue;
        // STREAK BEREKOR: garis tangensial (searah gerak), bukan bulat.
        // Ekor panjang & tebal (3.6·sz / 0.7·sz) agar tumpang tindih = padat.
        const tx = -Math.sin(aRot);
        const ty = Math.cos(aRot) * flat;
        const tl = Math.hypot(tx, ty) || 1;
        const ex = (tx / tl) * s.sz * 3.6;
        const ey = (ty / tl) * s.sz * 3.6;
        const twk = 0.7 + 0.3 * Math.sin(tSec * s.spin + s.tw);
        ctx.globalAlpha = (front ? 0.9 : 0.5) * twk * 0.85;
        ctx.strokeStyle = s.bright > 0.72 ? "#e8edff" : "#b2c7ff";
        ctx.lineWidth = Math.max(s.sz * 0.7, 1.0 * dpr);
        ctx.beginPath();
        ctx.moveTo(rx - ex, ry - ey);
        ctx.lineTo(rx + ex, ry + ey);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    // 1+2. Butir BELAKANG + DEPAN digambar DULU — keduanya tertutup bayangan.
    // Streak depan yang melintasi cakram menjadi tak terlihat (terokultasi),
    // kembali berwarna setelah keluar dari bayangan.
    paintRing(false);
    paintRing(true);
    // 3. Bayangan: lingkaran penuh pekat menutupi semua streak di dalamnya.
    // TANPA RIM, TANPA goresan sisi (dikembalikan per permintaan).
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, shR, 0, Math.PI * 2);
    ctx.fill();
    if (p >= 1) {
      dead = true;
      done();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    dead = true;
    cancelAnimationFrame(raf);
  };
}

// One-shot GL 2500ms: lubang membesar perlahan dari titik klik (uT 0→1),
// bintang jatuh radial + menghitam, lalu done() (= navigasi).
// Return false bila GL gagal/sibuk.
// Loop basi (runId berubah, mis. Esc) mati diam-diam tanpa memanggil done.
function runGL(
  canvas: HTMLCanvasElement,
  done: () => void,
  myRun: number,
  runRef: { current: number },
  cx: number,
  cyTop: number,
): boolean {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null;
  } catch {
    return false;
  }
  if (!gl) return false;
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);

  const compile = (type: number, src: string) => {
    const sh = gl!.createShader(type)!;
    gl!.shaderSource(sh, src);
    gl!.compileShader(sh);
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) return null;
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, WORM_VERT);
  const fs = compile(gl.FRAGMENT_SHADER, WORM_FRAG);
  if (!vs || !fs) return false;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uCenter = gl.getUniformLocation(prog, "uCenter");
  const uT = gl.getUniformLocation(prog, "uT");
  const uTime = gl.getUniformLocation(prog, "uTime");
  gl.uniform2f(uRes, w, h);
  gl.uniform2f(uCenter, cx, 1 - cyTop);

  const t0 = performance.now();
  const frame = () => {
    if (myRun !== runRef.current) return;
    const now = performance.now();
    const el = (now - t0) / WORMHOLE_MS; // 0..1
    if (el >= 1) {
      const lose = gl!.getExtension("WEBGL_lose_context");
      lose?.loseContext();
      done();
      return;
    }
    const p = el;
    gl!.uniform1f(uT, p);
    gl!.uniform1f(uTime, (now - t0) / 1000);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}
