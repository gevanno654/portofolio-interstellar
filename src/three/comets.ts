/* ————————————————————————————————
   comets.ts · Komet / bintang jatuh latar (global, bukan hero-only).

   - DUA sistem dalam satu Group (2 draw call):
     1. Heads — THREE.Points, titik terang hangat (mask lingkaran).
     2. Tails — THREE.LineSegments, garis 1px head→tail memudar.
   - Spawn tiap 2.5 dtk: 1–2 komet (desktop) / 1 (mobile), posisi +
     arah acak, tempat berbeda-beda. Lifetime ~2–3 dtk, mati saat
     keluar bingkai / hidup habis → alpha 0 (bukan pindah ke hero).
   - KEBAL mouse: shader tanpa uMouseUv/uSuck — posisi murni gerak
     sendiri, tidak bergeser saat hover (syarat eksplisit user).
   - Tersembunyi di balik lubang: alpha → 0 saat masuk Rs (CPU check,
     seperti discard bintang) → komet lewat belakang disk, bukan
     menimpa hitam.
   - Pause saat wormhole (scene tidak memanggil update). RM / device
     lemah → tidak dibuat (guard di BlackHoleScene).
   ———————————————————————————————— */

import * as THREE from "three";
import type { DustParams } from "./cosmicDust";

/** Bidang komet: di antara bintang (-8..-22) dan debu (-2). */
const COMET_Z = -5;
/** Interval spawn (dtk): 1–2 komet tiap interval. */
const SPAWN_EVERY = 2.5;

const HEAD_VERT = /* glsl */ `
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

const HEAD_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float m = smoothstep(0.5, 0.1, length(pc));
    if (m * vAlpha <= 0.003) discard;
    gl_FragColor = vec4(uColor, m * vAlpha);
  }
`;

const TAIL_VERT = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = aAlpha;
  }
`;

const TAIL_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    if (vAlpha <= 0.003) discard;
    gl_FragColor = vec4(uColor, vAlpha);
  }
`;

export type CometHandle = {
  object: THREE.Group;
  update: (p: DustParams) => void;
  dispose: () => void;
};

export function createComets(camera: THREE.PerspectiveCamera, max: number): CometHandle {
  // State per komet (slot ringkas: hidup = life > 0).
  const px = new Float32Array(max);
  const py = new Float32Array(max);
  const vx = new Float32Array(max);
  const vy = new Float32Array(max);
  const life = new Float32Array(max);
  const maxLife = new Float32Array(max);
  const tailLen = new Float32Array(max);

  // Heads (Points).
  const hPos = new Float32Array(max * 3);
  const hAlpha = new Float32Array(max);
  const hSize = new Float32Array(max);
  for (let i = 0; i < max; i++) hSize[i] = 2.2 + Math.random() * 1.2;
  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
  headGeo.setAttribute("aAlpha", new THREE.BufferAttribute(hAlpha, 1));
  headGeo.setAttribute("aSize", new THREE.BufferAttribute(hSize, 1));
  const headMat = new THREE.ShaderMaterial({
    vertexShader: HEAD_VERT,
    fragmentShader: HEAD_FRAG,
    uniforms: {
      uPixelRatio: { value: 1 },
      uScale: { value: 16 },
      uColor: { value: new THREE.Color(0xfff6e0) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const heads = new THREE.Points(headGeo, headMat);
  heads.frustumCulled = false;
  heads.renderOrder = 1;

  // Tails (LineSegments: head + ekor per komet).
  const tPos = new Float32Array(max * 2 * 3);
  const tAlpha = new Float32Array(max * 2);
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
  tailGeo.setAttribute("aAlpha", new THREE.BufferAttribute(tAlpha, 1));
  const tailMat = new THREE.ShaderMaterial({
    vertexShader: TAIL_VERT,
    fragmentShader: TAIL_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(0xe8d9b8) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const tails = new THREE.LineSegments(tailGeo, tailMat);
  tails.frustumCulled = false;
  tails.renderOrder = 1;

  const group = new THREE.Group();
  group.add(heads);
  group.add(tails);

  /** Cari slot mati; -1 bila penuh (lewati spawn, bukan menimpa). */
  const freeSlot = (): number => {
    for (let i = 0; i < max; i++) if (life[i] <= 0) return i;
    return -1;
  };

  /** Spawn 1 komet: posisi + arah acak (beda tiap spawn). */
  const spawnOne = () => {
    const i = freeSlot();
    if (i < 0) return;
    px[i] = (Math.random() * 2 - 1) * 0.95;
    py[i] = (Math.random() * 2 - 1) * 0.95;
    const ang = Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 0.5;
    vx[i] = Math.cos(ang) * speed;
    vy[i] = Math.sin(ang) * speed;
    maxLife[i] = 2.2 + Math.random() * 0.8;
    life[i] = maxLife[i];
    tailLen[i] = Math.max(0.1, Math.min(0.28, speed * 0.18));
  };

  // Satu komet langsung hidup saat modul dibuat (hero tak kosong).
  spawnOne();
  // Timer mulai 1.7 → spawn otomatis pertama setelah ~0.8 dtk.
  let timer = 1.7;
  // Mobile: hemat — selalu 1 per interval; desktop: 1–2 acak.
  const singleOnly = max <= 4;

  const update = (p: DustParams) => {
    // Bingkai mengikuti kamera (resize-safe), pola sama seperti debu.
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - COMET_Z);
    const s = 2 * halfH; // 1 unit-q = s unit dunia pada bidang ini
    const halfW = halfH * camera.aspect;
    const rOut = Math.hypot(halfW, halfH) * 1.06;
    group.position.set(0, 0, COMET_Z);
    group.scale.setScalar(rOut);
    (headMat.uniforms.uPixelRatio.value as number) = p.pr;

    // Spawn berkala tiap 2.5 dtk.
    timer += p.dt;
    if (timer >= SPAWN_EVERY) {
      timer = 0;
      const n = singleOnly ? 1 : Math.random() < 0.5 ? 1 : 2;
      for (let k = 0; k < n; k++) spawnOne();
    }

    // Faktor q per unit lokal (okultasi lubang).
    const kq = rOut / s;
    for (let i = 0; i < max; i++) {
      if (life[i] <= 0) {
        hAlpha[i] = 0;
        tAlpha[i * 2] = 0;
        tAlpha[i * 2 + 1] = 0;
        continue;
      }
      life[i] -= p.dt;
      px[i] += vx[i] * p.dt;
      py[i] += vy[i] * p.dt;
      // Mati: hidup habis / keluar bingkai.
      if (life[i] <= 0 || Math.abs(px[i]) > 1.3 || Math.abs(py[i]) > 1.3) {
        life[i] = 0;
        hAlpha[i] = 0;
        tAlpha[i * 2] = 0;
        tAlpha[i * 2 + 1] = 0;
        continue;
      }

      // Amplop: fade-in 0.2 dtk + fade-out 0.6 dtk.
      const age = maxLife[i] - life[i];
      const fadeIn = Math.max(0, Math.min(1, age / 0.2));
      const fadeOut = Math.max(0, Math.min(1, life[i] / 0.6));
      let a = fadeIn * fadeOut;
      // Okultasi: masuk Rs → 0 (komet lewat belakang disk).
      if (p.rs > 0) {
        const qx = px[i] * kq;
        const qy = py[i] * kq;
        const dHole = Math.hypot(qx - p.cx, qy - p.cy);
        const occ = Math.max(0, Math.min(1, (dHole - p.rs * 0.9) / (p.rs * 0.2 + 1e-4)));
        a *= occ;
      }

      hPos[i * 3] = px[i];
      hPos[i * 3 + 1] = py[i];
      hPos[i * 3 + 2] = 0;
      hAlpha[i] = a * 0.9;

      // Ekor berlawanan arah gerak (dinormalisasi × panjang ekor).
      const sp = Math.max(1e-4, Math.hypot(vx[i], vy[i]));
      const tx = px[i] - (vx[i] / sp) * tailLen[i];
      const ty = py[i] - (vy[i] / sp) * tailLen[i];
      tPos[i * 6] = px[i];
      tPos[i * 6 + 1] = py[i];
      tPos[i * 6 + 2] = 0;
      tPos[i * 6 + 3] = tx;
      tPos[i * 6 + 4] = ty;
      tPos[i * 6 + 5] = 0;
      tAlpha[i * 2] = a * 0.55;
      tAlpha[i * 2 + 1] = 0;
    }
    (headGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (headGeo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    (tailGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (tailGeo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
  };

  const dispose = () => {
    headGeo.dispose();
    headMat.dispose();
    tailGeo.dispose();
    tailMat.dispose();
  };

  return { object: group, update, dispose };
}
