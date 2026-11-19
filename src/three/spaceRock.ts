/* ————————————————————————————————
   spaceRock.ts · batu luar angkasa prosedural (item Develop).

   - Icosahedron detail 5 + displacement noise deterministik (seed tetap)
   - Tekstur kawah dari offscreen canvas (map + bumpMap)
   - 1 directional hangat kiri-atas + rim biru kanan-belakang + ambient
   - Idle: melayang (sine Y) + rotasi pelan 2 sumbu via RAF
   - API: createSpaceRock(container, opts?) → { dispose, ok }
   - WebGL gagal / frozen (RM): render 1 frame statis, tanpa loop
   ———————————————————————————————— */

import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export type RockHandle = {
  dispose: () => void;
  ok: boolean;
};

export function createSpaceRock(
  container: HTMLElement,
  opts?: { frozen?: boolean },
): RockHandle {
  const noop = () => {};
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return { dispose: noop, ok: false };
  }

  const frozen = opts?.frozen === true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  // Batu utuh dalam bingkai: radius 1 + margin → z 4.6 untuk FOV 35°.
  camera.position.set(0, 0.25, 4.6);
  camera.lookAt(0, 0, 0);

  // Geometri: icosahedron detail 32 + displacement tiga oktaf —
  // kasar (0.14) untuk siluet tak beraturan, tengah (0.07) + halus
  // (0.03) untuk granularitas permukaan. mergeVertices agar normal halus.
  // Kawah MURNI shading (tekstur + bump, opsi B 2026-11-20): tanpa ukiran
  // geometri — satu sistem, tak ada risiko misalignment.
  const SEED = 1.37;
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 32);
  geo = mergeVertices(geo);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const { x, y, z } = v;
    const d =
      0.14 *
        Math.sin(2.3 * x + SEED) *
        Math.sin(1.9 * y + SEED * 0.5) *
        Math.sin(2.1 * z + SEED * 0.3) +
      0.07 *
        Math.sin(6.1 * x + SEED) *
        Math.sin(5.7 * y + 1.7) *
        Math.sin(6.6 * z + 0.6) +
      0.03 * Math.sin(13 * x + 1.1) * Math.sin(11 * y + 2.2) * Math.sin(12 * z + 0.4);
    v.multiplyScalar(1 + d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  // Tekstur kawah: offscreen canvas 512, dasar abu kecoklatan + kawah elips.
  const texCanvas = document.createElement("canvas");
  texCanvas.width = 512;
  texCanvas.height = 512;
  const g = texCanvas.getContext("2d");
  let map: THREE.CanvasTexture | null = null;
  if (g) {
    g.fillStyle = "#8d8177";
    g.fillRect(0, 0, 512, 512);
    // Bintik halus agar tak rata.
    for (let i = 0; i < 900; i++) {
      const x = (i * 137.5) % 512;
      const y = (i * 89.3) % 512;
      const r = 1 + ((i * 7) % 4);
      g.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // ±24 kawah: mangkuk radial — inti umbra gelap → penumbra → rim
    // terang sempit di sisi cahaya (kiri-atas), lalu blend ke dasar.
    // Tanpa stroke elips: highlight mengikuti busur cahaya, bukan outline.
    // Ukuran bervariasi (kecil 8px s/d besar 44px) seperti referensi.
    for (let i = 0; i < 24; i++) {
      const x = (i * 173.3 + 40) % 512;
      const y = (i * 211.7 + 90) % 512;
      const gold = ((i * 2654435761) % 1000) / 1000;
      const r = 8 + gold * 36;
      // Mangkuk: gelap di tengah, memudar ke tepi.
      const bowl = g.createRadialGradient(x, y, r * 0.1, x, y, r);
      bowl.addColorStop(0, "rgba(52,45,38,0.9)");
      bowl.addColorStop(0.55, "rgba(74,66,59,0.75)");
      bowl.addColorStop(0.85, "rgba(110,100,88,0.35)");
      bowl.addColorStop(1, "rgba(110,100,88,0)");
      g.fillStyle = bowl;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      // Tanpa rim stroke: dinding kawah yang tersinari SUDAH muncul dari
      // key light via bump normal — garis gambar justru terlihat lepas
      // karena tak mengikuti deformasi permukaan. Mangkuk radial cukup.
    }
    map = new THREE.CanvasTexture(texCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
  }

  const mat = new THREE.MeshStandardMaterial({
    map: map ?? undefined,
    bumpMap: map ?? undefined,
    // Relief kawah dibaca dari bump: naik agar cekungan terbaca dalam.
    bumpScale: 3,
    color: 0xcfc2b4,
    roughness: 0.95,
    metalness: 0,
  });
  const rock = new THREE.Mesh(geo, mat);
  rock.rotation.set(0.35, 0.6, 0.1);
  scene.add(rock);

  // Cahaya hangat kiri-atas-depan; rim biru kanan-belakang; ambient
  // dingin. Fill bawah REDUP agar relief bump terbaca (cahaya dari
  // bawah meniadakan bayangan cekungan).
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4);
  key.position.set(-3, 2.5, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ea8ff, 1.4);
  rim.position.set(2.5, -1, -2.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fa3c7, 0.25);
  fill.position.set(0.5, -2.5, 1.5);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x223044, 0.6));

  const setSize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(setSize);
  ro.observe(container);
  setSize();

  let raf = 0;
  let disposed = false;
  const t0 = performance.now();
  const tick = () => {
    if (disposed) return;
    const t = (performance.now() - t0) / 1000;
    rock.position.y = Math.sin(t * 0.6) * 0.12;
    rock.rotation.y += 0.15 / 60;
    rock.rotation.x = 0.35 + Math.sin(t * 0.23) * 0.08;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  if (frozen) {
    // RM: tepat 1 frame statis, tanpa RAF.
    renderer.render(scene, camera);
  } else {
    tick();
  }

  return {
    ok: true,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
