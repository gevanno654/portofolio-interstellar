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
  camera.position.set(0, 0.25, 3.2);
  camera.lookAt(0, 0, 0);

  // Geometri: icosahedron detail 5 + displacement noise deterministik.
  const SEED = 1.37;
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const { x, y, z } = v;
    const d =
      0.28 *
        Math.sin(3.1 * x + SEED) *
        Math.sin(2.7 * y + SEED * 0.5) *
        Math.sin(3.3 * z) +
      0.12 *
        Math.sin(7 * x + SEED) *
        Math.sin(6.3 * y + 1.7) *
        Math.sin(5.6 * z + 0.6);
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
    // ±40 kawah: elips gelap + highlight tepi bawah-kanan.
    for (let i = 0; i < 40; i++) {
      const x = (i * 173.3 + 40) % 512;
      const y = (i * 211.7 + 90) % 512;
      const rx = 8 + ((i * 13) % 26);
      const ry = rx * (0.6 + ((i * 5) % 10) / 25);
      g.fillStyle = "rgba(74,66,59,0.85)";
      g.beginPath();
      g.ellipse(x, y, rx, ry, (i * 0.7) % Math.PI, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(255,235,210,0.5)";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, y, rx, ry, (i * 0.7) % Math.PI, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
    map = new THREE.CanvasTexture(texCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
  }

  const mat = new THREE.MeshStandardMaterial({
    map: map ?? undefined,
    bumpMap: map ?? undefined,
    bumpScale: 0.6,
    color: 0xbdb2a6,
    roughness: 1,
    metalness: 0,
  });
  const rock = new THREE.Mesh(geo, mat);
  rock.rotation.set(0.35, 0.6, 0.1);
  scene.add(rock);

  const key = new THREE.DirectionalLight(0xffe2b8, 2.2);
  key.position.set(-3, 2.5, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ea8ff, 1.2);
  rim.position.set(2.5, -1, -2.5);
  scene.add(rim);
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
