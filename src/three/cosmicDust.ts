/* ————————————————————————————————
   cosmicDust.ts · Elemen C — partikel debu kosmik tersedot black hole.

   - Satu THREE.Points = 1 draw call. State di Float32Array,
     update CPU per-frame murah (400 desktop / 120 mobile).
   - Spiral: r -= scrollVelocity*k*dt (+ drift ambient),
     θ += dt*spin/r (diferensial: makin dekat makin cepat).
     Fade di horizon (r → Rs) + tepi luar, respawn di luar.
   - Lapis 4, terdepan BG: renderOrder 2, di atas quad lubang
     (-10) dan 3 lapis bintang (0). Satu-satunya scene tetap
     milik BlackHoleScene — modul ini menumpang (tanpa kanvas baru).
   - Guard: RM → scene tidak dibuat (Cosmos); mobile lemah → 0.
   - Pause + hidden saat transisi wormhole (Elemen I) aktif.
   ———————————————————————————————— */

import * as THREE from "three";

const DUST_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.1);
    gl_PointSize = aSize * uPixelRatio * (uScale / dist);
    vAlpha = aAlpha;
  }
`;

const DUST_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float m = smoothstep(0.5, 0.06, length(pc));
    gl_FragColor = vec4(uColor, m * vAlpha);
  }
`;

export type DustParams = {
  dt: number;
  t: number;
  /** Pusat lubang dalam unit-q shader (sama seperti uCenter bintang). */
  cx: number;
  cy: number;
  /** Radius bayangan saat ini (unit-q, 0 = lubang belum memadat). */
  rs: number;
  /** Kecepatan scroll ter-smooth + decay (px/s, + = turun). */
  vel: number;
  pr: number;
  /** Faktor hero 0..1 (1 = opacity 100%, 0 = about masuk). Infall only. */
  hero?: number;
};

export type DustHandle = {
  object: THREE.Points;
  update: (p: DustParams) => void;
  dispose: () => void;
};

/** Bidang debu: di depan bintang (z bintang ≈ -8..-22), di belakang konten. */
const DUST_Z = -2;
/** Konversi px/s → unit-lokal/s: 3000px/s → 0.36/s (lintas layar ±3 detik). */
const VEL_K = 0.00012;
const TAU = Math.PI * 2;

export function createDust(camera: THREE.PerspectiveCamera, count: number): DustHandle {
  const radius = new Float32Array(count);
  const theta = new Float32Array(count);
  const spin = new Float32Array(count);
  const phase = new Float32Array(count);
  const pos = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const size = new Float32Array(count);

  const seed = (i: number, outer: boolean) => {
    radius[i] = outer ? 1.0 + Math.random() * 0.06 : 0.15 + 0.85 * Math.sqrt(Math.random());
    theta[i] = Math.random() * TAU;
    // Spin per-partikel tetap: 0.25..1.15 (diferensial via /r di update).
    spin[i] = 0.25 + Math.random() * 0.9;
  };
  for (let i = 0; i < count; i++) {
    seed(i, false);
    phase[i] = Math.random() * TAU;
    size[i] = 1.2 + Math.random() * 1.6;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * 0.35;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms: {
      uPixelRatio: { value: 1 },
      uScale: { value: 16 },
      uColor: { value: new THREE.Color(0xd8c49a) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const object = new THREE.Points(geo, mat);
  object.frustumCulled = false;
  // Lapis 4, terdepan BG: di atas quad lubang (-10) + 3 lapis bintang (0).
  object.renderOrder = 2;

  const update = (p: DustParams) => {
    // Bingkai mengikuti kamera (resize-safe): setengah tinggi dunia
    // pada bidang debu, lalu radius luar = diagonal layar × 1.06.
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - DUST_Z);
    const s = 2 * halfH; // 1 unit-q = s unit dunia pada bidang ini
    const halfW = halfH * camera.aspect;
    const rOut = Math.hypot(halfW, halfH) * 1.06;
    object.position.set(p.cx * s, p.cy * s, DUST_Z);
    object.scale.setScalar(rOut);
    (mat.uniforms.uPixelRatio.value as number) = p.pr;

    // Horizon lokal: Rs dunia / radius luar. rs = 0 (hero) → tanpa lubang.
    const rh = p.rs > 0 ? (p.rs * s) / rOut : 0;
    const vN = Math.max(-1.5, Math.min(1.5, p.vel / 2500));
    // Baseline idle tetap hidup: 0.45 (bukan 0.1) → tak nyaris-hilang;
    // scroll hanya boost ke 1.0.
    const glow = 0.45 + 0.55 * Math.min(1, Math.abs(p.vel) / 1800);

    for (let i = 0; i < count; i++) {
      // Spiral MASUK murni (bukan scrolling radial): drift ambient 0.006
      // kecil + terkendali (bukan -uTime unbounded). Scroll mempercepat
      // sesaat via VEL_K. Stabil dibuka berjam-jam: r di-clamp [0.02..1.15]
      // + respawn outer → tak menumpuk jadi garis-garis.
      // Idle tenang tapi hidup: 0.006 (bukan 0).
      let r = radius[i] - (0.006 + p.vel * VEL_K) * p.dt;
      if (r < rh || r < 0.02) {
        seed(i, true);
        r = radius[i];
      } else if (r > 1.15) {
        r = 1.15;
      }
      radius[i] = r;
      // Baseline idle 0.5 rad/s (diferensial /r: dalam lebih cepat);
      // scroll hanya boost +0.55. Idle TIDAK pernah 0.05 → tak berhenti.
      const w = 0.5 + Math.abs(vN) * 0.55;
      const t = (theta[i] + (p.dt * w * spin[i]) / Math.max(r, 0.12)) % TAU;
      theta[i] = t;

      pos[i * 3] = Math.cos(t) * r;
      pos[i * 3 + 1] = Math.sin(t) * r;

      // Fade: tepi luar masuk + horizon tersedot + gemerlap + glow velocity.
      const edge = Math.max(0, Math.min(1, (1.06 - r) / 0.18));
      const hz = rh <= 0 ? 1 : Math.max(0, Math.min(1, (r - rh) / (rh * 0.8 + 0.05)));
      const tw = 0.7 + 0.3 * Math.sin(p.t * spin[i] + phase[i]);
      alpha[i] = edge * hz * tw * glow * 0.85;
    }
    (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
  };

  const dispose = () => {
    geo.dispose();
    mat.dispose();
  };

  return { object, update, dispose };
}
