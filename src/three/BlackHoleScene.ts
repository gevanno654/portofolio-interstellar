/* ————————————————————————————————————————————————
   BlackHoleScene.ts · satu-satunya scene WebGL situs.

   - Fullscreen quad → fragment shader black hole
   - 3 layer THREE.Points → starfield berlapis
   - API: mount(el) → { setScroll, dispose }
   - Pointer parallax di-lerp di dalam RAF (sinematik)
   - Memberhentikan loop saat tab hidden / saat dispose
   ———————————————————————————————————————————————— */

import * as THREE from "three";
import { HOLE_FRAG, QUAD_VERT, STARS_FRAG, STARS_VERT } from "./blackHoleShaders";

export type SceneHandle = {
  setScroll: (t: number) => void;
  /** 1 = lubang penuh (dikelola scene via mix hero→fade). */
  setHoleVis: (v: number) => void;
  /** Kecepatan scroll (px/s, + = turun). Dipakai Elemen C. */
  setVelocity: (v: number) => void;
  /** Cermin kemiringan disk 0 (hero +15°) → 1 (about −15°). */
  setMirror: (v: number) => void;
  /** true = transisi wormhole (I) aktif → debu berhenti. */
  wormholeActive: boolean;
  dispose: () => void;
  ok: boolean;
};

/** Mobile lemah (CPU/RAM kecil / save-data) → tanpa debu. */
function isWeakDevice(): boolean {
  try {
    const nav = navigator as Navigator & {
      hardwareConcurrency?: number;
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData) return true;
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3) return true;
    if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return true;
  } catch {
    return false;
  }
  return false;
}

function isMobileWidth(): boolean {
  return window.innerWidth < 768;
}

export function createScene(container: HTMLElement): SceneHandle {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    document.documentElement.classList.add("no-webgl");
    return { setScroll: () => {}, setHoleVis: () => {}, setVelocity: () => {}, setMirror: () => {}, wormholeActive: false, dispose: () => {}, ok: false };
  }

  const mobile = isMobileWidth();

  // Skala lubang mengikuti lebar viewport: di layar sempit lubang
  // digambar lebih kecil agar tidak terpotong dan tidak menelan teks.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x05070d, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Kamera ortografik "palsu": quad fullscreen + bintang di z negatif
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  const BASE_RS = 0.115;

  // Lubang TERKUNCI di slot hero: semua skala dari lebar slot.
  // fitScale/uRsBase/uCenterY jauh DIHAPUS (aturan about/skills/bawah).
  const holeUniforms = {
    // uRes = ukuran BUFFER (device px = CSS x pixelRatio): gl_FragCoord
    // dalam device px, jadi uv = FragCoord/uRes tetap 0..1. Sebelumnya
    // CSS px → uv melebar pixelRatio-x (2x di DPR=2) → lubang render di
    // ~(0.36, 0.69) padahal jangkar (0.75, 0.44). Terukur via piksel.
    uRes: { value: new THREE.Vector2(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()) },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uHoleVis: { value: 1 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uRsBase: { value: BASE_RS },
    // uAnchorRs: skala lubang dari lebar slot (efek dolly-zoom out:
    // scroll → lubang MEMBESAR mendekat, teks diam + fade — moncy.dev).
    uAnchorRs: { value: BASE_RS },
    uDolly: { value: 0 },
    // uZoom: 0 di hero → 1 mid-scroll: pusat bergeser dari slot ke
    // tengah viewport + scale-up sinematik (moncy: karakter ke pusat
    // + kamera dolly-in). Di-lerp CPU agar sinematik, di-drive MURNI
    // dari scrollY (scrub-linked, tanpa state timeline baru).
    uZoom: { value: 0 },
    uCenterY: { value: 0 },
    // Jangkar slot hero (diisi tiap frame dari getBoundingClientRect).
    uAnchor: { value: new THREE.Vector2(0, 0) },
    uAnchorMix: { value: 1 },
    // Parallax 3D: tilt pointer -1..1 (di-lerp CPU ~0.45s, subtil).
    uPar: { value: new THREE.Vector2(0, 0) },
    // uMirror: 0 hero (kemiringan +15°) → 1 about (cermin −15°).
    // Di-tween CPU dari progress travel Cosmos via setMirror; shader
    // memakai mix(+15, −15) agar disk terbalik mulus, bukan blink.
    uMirror: { value: 0 },
  };

  const hole = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: HOLE_FRAG,
      uniforms: holeUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  );
  hole.frustumCulled = false;
  hole.renderOrder = -10;
  scene.add(hole);

  // ——— Starfield 3 lapis ———
  const starUniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, mobile ? 1.5 : 2) },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uCenter: { value: new THREE.Vector2(0, 0) },
    uRs: { value: BASE_RS },
    // Geser lokal ikut mouse (0..1 UV) + on/off. Murni fungsi posisi →
    // otomatis kembali saat mouse pergi. Di-lerp di RAF (sinematik).
    uMouseUv: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseOn: { value: 0 },
    // Hisap ke lubang slot: pusat + radius dari jangkar, on = mix hero.
    uSuckCenter: { value: new THREE.Vector2(0, 0) },
    uSuckRad: { value: 0.35 },
    uSuckOn: { value: 1 },
  };

  const starGroup = new THREE.Group();
  const COUNT = mobile ? 600 : 2200;
  const LAYERS = 3;

  // Palet bintang: dominan putih hangat, sedikit aksen
  const palette = [
    new THREE.Color(0xd9dce5),
    new THREE.Color(0xd9dce5),
    new THREE.Color(0xe8e2d2),
    new THREE.Color(0xc4a477),
    new THREE.Color(0x8fa3c4),
  ];

  for (let l = 0; l < LAYERS; l++) {
    const n = Math.floor(COUNT / LAYERS);
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const speed = new Float32Array(n);
    const color = new Float32Array(n * 3);
    const layer = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      // Sebaran bola di depan kamera
      const r = 12 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2 - 1) * r * 0.6;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = -r * 0.7;

      size[i] = (l === 0 ? 2.6 : l === 1 ? 1.7 : 1.1) * (0.6 + Math.random() * 0.8);
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.4 + Math.random() * 1.2;
      const c = palette[Math.floor(Math.random() * palette.length)];
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
      layer[i] = l / (LAYERS - 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aLayer", new THREE.BufferAttribute(layer, 1));

    starGroup.add(
      new THREE.Points(
        geo,
        new THREE.ShaderMaterial({
          vertexShader: STARS_VERT,
          fragmentShader: STARS_FRAG,
          uniforms: starUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
  }
  scene.add(starGroup);

  // ——— Elemen C: debu kosmik DIMATIKAN per permintaan (mengganggu).
  // Tidak dibuat sama sekali; tak ada variabel, tak ada update, tak ada
  // dispose. Komet (di bawah) tak tersentuh.
  const weak = isWeakDevice();

  // ——— Komet latar: 1–2 tiap 2.5 dtk, posisi/arah acak (2 draw) ———
  // Global (bukan hero-only); kebal mouse-hover (tanpa uMouse/uSuck).
  // Pause saat wormhole. Desktop 6 slot / mobile 4 (selalu 1 per spawn).
  const cometMax = mobile ? 4 : 6;
  let comets: { object: THREE.Group; update: (p: import("./cosmicDust").DustParams) => void; dispose: () => void } | null = null;
  if (!weak) {
    import("./comets").then(({ createComets }) => {
      if (disposed) return;
      comets = createComets(camera, cometMax);
      scene.add(comets.object);
    });
  }

  // ——— Interaksi: pointer + scroll (target, di-lerp di RAF) ———
  // Starfield: twinkle + parallax + geser mouse tetap jalan;
  // drift scroll & resesi DIMATIKAN (lubang terkunci di slot).
  // Parallax 3D (anti AI-slop): DUA lerp berlapis —
  // - pointer (cepat, ~1.2s): pusat lubang + bintang (halus sinematik)
  // - par (lambat, ~0.45s): sumbu tilt + inklinasi + hotspot doppler
  // Beda kecepatan lapis = kesan volume fisik, bukan tempel-stiker.
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointer = new THREE.Vector2(0, 0);
  const parTarget = new THREE.Vector2(0, 0);
  const par = new THREE.Vector2(0, 0);
  // Pusat + radius AKTUAL lubang per frame (mirror rumus shader:
  // mix(C0, tengah, 0.35*zoom) + Rs*(1+0.35*dolly)*(1+0.35*zoom)) — dipakai
  // bintang (discard/okultasi), hisap debu, dan komet agar mengikuti
  // lubang yang bergeser ke pusat + scale-up (bukan slot lama).
  // Tanpa alokasi per frame.
  const zoomCenter = new THREE.Vector2(0, 0);
  // Mouse UV 0..1 (Y dibalik agar 0 = bawah) + on/off. Murni posisi →
  // bintang terdorong sedikit di dekat mouse, kembali saat pergi.
  const mouseTarget = new THREE.Vector2(0.5, 0.5);
  const mouseUv = new THREE.Vector2(0.5, 0.5);
  let mouseTargetOn = 0;
  let mouseOn = 0;
  let lastPointerT = -1e9;
  // scrollCurrent/scrollTarget + resesi jauh: DIMATIKAN TOTAL
  // (lubang terkunci di slot). setScroll = no-op agar handle valid.
  // Lubang TERKUNCI di slot hero: mix + vis penuh selagi slot terlihat,
  // fade 0 saat Transmission (#about) masuk. TIDAK ada aturan about/skills
  // bawah (tidak berpindah ke tengah halaman). Di-lerp 0.6s (fade biasa).
  let visCurrent = 1;
  let anchorMixCur = 1;
  let dollyCur = 0;
  let zoomCur = 0;
  // Kecepatan scroll ter-smooth (px/s, + = turun), decay eksponensial.
  // Masih diteruskan ke DEBU (hisap di slot hero saat scroll cepat).
  let velTarget = 0;
  let velCurrent = 0;

  // Jangkar slot hero: diukur TIAP FRAME (lubang terkunci di slot —
  // ikut scroll alami bersama hero karena rect berubah saat scroll).
  // Murah: 1 getBoundingClientRect/frame (tanpa layout thrash: read-only).
  // Ukur WADAH .hero-slot-global (bukan isi): isi mengisi 100% wadah,
  // tapi spesifisitas CSS bisa membuat isi lebih kecil dari wadah.
  const measureSlot = () => {
    const slotEl = (document.querySelector(".hero-slot-global") ?? document.querySelector(".hero-ornament.hero-blackhole, .orbital-sigil")) as HTMLElement | null;
    if (!slotEl) return;
    const r = slotEl.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (r.width <= 4 || r.height <= 4) return;
    const asp = w / h;
    // Ruang-q shader: origin tengah, x dikali asp, y fraksi setengah tinggi.
    const qx = ((r.left + r.width / 2) / w - 0.5) * asp;
    const qy = 0.5 - (r.top + r.height / 2) / h;
    (holeUniforms.uAnchor.value as THREE.Vector2).set(qx, qy);
    // Skala dari LEBAR SLOT: disk luar (Rs*3.2) muat 95% lebar slot.
    // Slot sengaja bleed ke kanan (estetik) — lubang ikut membesar,
    // tepi yang keluar viewport terpotong alami oleh tepi layar.
    (holeUniforms.uAnchorRs.value as number) = ((r.width / h / 2 / 3.2) * 0.95);
  };

  const onPointerMove = (e: PointerEvent) => {
    pointerTarget.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1),
    );
    // Parallax 3D: target sama tapi di-lerp terpisah (lebih lambat)
    // agar sumbu disk tertinggal dari pusat → kesan kedalaman.
    parTarget.copy(pointerTarget);
    // Geser lokal bintang: posisi mouse 0..1 UV, aktifkan dorongan.
    mouseTarget.set(
      Math.max(0, Math.min(e.clientX / window.innerWidth, 1)),
      Math.max(0, Math.min(1 - e.clientY / window.innerHeight, 1)),
    );
    mouseTargetOn = 1;
    lastPointerT = performance.now();
  };
  const onPointerLeave = () => {
    mouseTargetOn = 0;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  // Mouse pergi (keluar jendela / blur / touch selesai) → kembali ke awal.
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("blur", onPointerLeave);
  window.addEventListener("pointercancel", onPointerLeave);

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const m = w < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, m ? 1.5 : 2));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    (holeUniforms.uRes.value as THREE.Vector2).set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    starUniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, m ? 1.5 : 2);
    starUniforms.uAspect.value = w / h;
    measureSlot();
  };
  window.addEventListener("resize", onResize);
  // Ukur setelah layout stabil (font hero memengaruhi posisi slot).
  requestAnimationFrame(() => {
    measureSlot();
    requestAnimationFrame(measureSlot);
  });

  // ——— RAF loop (berhenti saat tab hidden) ———
  let raf = 0;
  let running = true;
  let last = performance.now();
  let disposed = false;
  let wormholeActive = false;
  let elapsed = 0;

  // Elemen I memakai handle ini secara async. Nilai dispose diisi
  // di bawah (function hoisting aman untuk pemakaian di dalam closure).
  // visTarget: start 1 (lubang tampil sejak hero). Cosmos set 1 tiap update.
  // Scroll/resesi jauh DIMATIKAN — hole terkunci di slot hero.
  let visTarget = 1;
  // Target cermin kemiringan (0 hero → 1 about), di-lerp di loop.
  let mirrorTarget = 0;
  let mirrorCur = 0;
  const publicHandle: SceneHandle = {
    setScroll: (_v: number) => {},
    setHoleVis: (v: number) => {
      visTarget = Math.min(1, Math.max(0, v));
    },
    setVelocity: (v: number) => {
      velTarget = v;
    },
    /** Cermin kemiringan disk 0 (hero +15°) → 1 (about −15°). */
    setMirror: (v: number) => {
      mirrorTarget = Math.min(1, Math.max(0, v));
    },
    get wormholeActive() {
      return wormholeActive;
    },
    set wormholeActive(v: boolean) {
      wormholeActive = v;
    },
    dispose: () => doDispose(),
    ok: true,
  };
  try {
    (window as unknown as { __sceneHandle?: SceneHandle }).__sceneHandle = publicHandle;
  } catch {
    /* abaikan */
  }

  // Fade lubang IKUT PROGRESS scroll hero→about (bukan gerbang biner):
  // opacity meluruh halus selaras teks; 1 notch scroll desktop ≈ 70%
  // hilang. Resolusi rendah → mix di-hitung di dalam loop (bukan event).
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!disposed) {
      running = true;
      last = performance.now();
      loop();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const loop = () => {
    if (!running || disposed) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    const t = elapsed;

    // Lerp → gerakan lambat & sinematik (time constant ~1.2s).
    // Parallax lapis-2 (~0.45s): sumbu tilt tertinggal dari pusat.
    const k = 1 - Math.exp(-dt / 1.2);
    pointer.lerp(pointerTarget, k);
    par.lerp(parTarget, 1 - Math.exp(-dt / 0.45));
    // Jangkar diukur tiap frame → lubang TERKUNCI di slot (ikut scroll
    // alami bersama hero + travel scrub). Tanpa scrollCurrent/visCurrent jauh.
    measureSlot();
    // Dolly-zoom out DIMATIKAN: transisi out blackhole MURNI opasitas
    // (uAnchorMix → 0). Radius selalu = radius slot (tanpa pembesaran).
    const dollyT = 0;
    dollyCur += (dollyT - dollyCur) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(dollyCur - dollyT) < 0.005) dollyCur = dollyT;
    (holeUniforms.uDolly.value as number) = dollyCur;
    // Zoom sinematik DIMATIKAN: transisi out blackhole MURNI opasitas
    // (uAnchorMix → 0). Pusat + radius selalu mirror slot (tanpa geser
    // ke tengah, tanpa scale-up).
    const zoomT = 0;
    zoomCur += (zoomT - zoomCur) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(zoomCur - zoomT) < 0.005) zoomCur = zoomT;
    (holeUniforms.uZoom.value as number) = zoomCur;
    // Pusat + radius aktual (mirror shader): bintang/debu/komet
    // mengikuti lubang yang bergerak (lihat deklarasi zoomCenter).
    zoomCenter.set(
      (holeUniforms.uAnchor.value as THREE.Vector2).x * (1 - 0.35 * zoomCur),
      (holeUniforms.uAnchor.value as THREE.Vector2).y * (1 - 0.35 * zoomCur),
    );
    // Fade lubang BERBASIS ABOUT di viewport (travel kanan→kiri):
    // hero (about di bawah fold) → mix 1 penuh; about masuk & sepanjang
    // terlihat → TAHAN 1 (mengiringi teks, bukan luruh); setelah about
    // lewat (bottom di atas viewport top) → luruh cepat → 0.
    // Geometri dibaca dari rect #about (jujur, tanpa master px).
    // Lerp 0.1s + snap 0.005 (transisi singkat ikut roda).
    const aboutEl = document.getElementById("about");
    let mixT: number;
    if (!aboutEl) {
      mixT = 1;
    } else {
      const r = aboutEl.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top >= vh) mixT = 1; // about masih di bawah fold = hero penuh
      else if (r.bottom <= 0) mixT = 0; // about sudah lewat = luruh
      else mixT = 1; // about terlihat (masuk/tengah) = bertahan penuh
    }
    anchorMixCur += (mixT - anchorMixCur) * (1 - Math.exp(-dt / 0.1));
    if (Math.abs(anchorMixCur - mixT) < 0.005) anchorMixCur = mixT;
    (holeUniforms.uAnchorMix.value as number) = anchorMixCur;
    // Lubang selalu penuh (1) selagi di slot; fade via mix → 0.
    // visTarget (Cosmos) hanya gerbang luar — aktual = mix.
    // Jangkar MURNI dari slot (tanpa clamp): posisi & skala lubang
    // sepenuhnya milik CSS slot. Clamp lama DIHAPUS — ia memaksa pusat
    // ke 0.32..0.75 (tengah-teks) padahal slot terukur di kanan-bleed.
    visCurrent = anchorMixCur * visTarget;
    holeUniforms.uHoleVis.value = visCurrent;
    // Decay eksponensial ~0.35s: scroll cepat → hisap kuat,
    // berhenti → melambat & memudar.
    velCurrent += (velTarget - velCurrent) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(velCurrent) < 0.5 && Math.abs(velTarget) < 0.5) velCurrent = 0;

    holeUniforms.uTime.value = t;
    holeUniforms.uScroll.value = 0;
    holeUniforms.uHoleVis.value = visCurrent;
    (holeUniforms.uPointer.value as THREE.Vector2).copy(pointer);
    // Parallax 3D ke shader (sumbu tilt + inklinasi + doppler).
    (holeUniforms.uPar.value as THREE.Vector2).copy(par);
    // Cermin kemiringan: di-lerp ~0.45s (sinematik, selaras tilt travel).
    mirrorCur += (mirrorTarget - mirrorCur) * (1 - Math.exp(-dt / 0.45));
    if (Math.abs(mirrorCur - mirrorTarget) < 0.002) mirrorCur = mirrorTarget;
    (holeUniforms.uMirror.value as number) = mirrorCur;

    // Starfield statis sinematik: twinkle + parallax + geser mouse tetap
    // jalan; drift scroll & resesi DIMATIKAN (lubang terkunci di slot).
    starUniforms.uTime.value = t;
    starUniforms.uScroll.value = 0;
    (starUniforms.uPointer.value as THREE.Vector2).copy(pointer);
    // Geser lokal: timeout diam 1.2 dtk → anggap mouse pergi, kembali.
    // Di-lerp agar pergi-kembali mulus sinematik (bukan lompat).
    if (now - lastPointerT > 1200) mouseTargetOn = 0;
    mouseUv.lerp(mouseTarget, 1 - Math.exp(-dt / 0.35));
    mouseOn += (mouseTargetOn - mouseOn) * (1 - Math.exp(-dt / 0.45));
    if (Math.abs(mouseOn) < 0.002) mouseOn = 0;
    (starUniforms.uMouseUv.value as THREE.Vector2).copy(mouseUv);
    (starUniforms.uMouseOn.value as number) = mouseOn;
    // Bintang dilubangi TEPAT di pusat aktual (ikut zoom ke tengah).
    starUniforms.uRs.value = (holeUniforms.uAnchorRs.value as number) * (1.0 + 0.35 * dollyCur) * (1.0 + 0.35 * zoomCur) * visCurrent;
    (starUniforms.uCenter.value as THREE.Vector2).copy(zoomCenter);
    // Hisap radial DIMATIKAN per permintaan (mengganggu): bintang diam,
    // twinkle + parallax mouse tetap jalan. uSuckOn dipaksa 0 konstan.
    (starUniforms.uSuckCenter.value as THREE.Vector2).copy(zoomCenter);
    starUniforms.uSuckRad.value = (holeUniforms.uAnchorRs.value as number) * 3.5 + 0.12;
    (starUniforms.uSuckOn.value as number) = 0;

    // (Elemen C debu kosmik dimatikan — tak ada update di sini.)

    // ——— Komet latar: spawn 2.5 dtk (di dalam update) — pause wormhole. ———
    // Global + kebal hover; diokultasi lubang (lewat belakang disk).
    // Pusat infall TIDAK dipakai (bukan hero-only, posisi bebas acak).
    if (comets && !wormholeActive) {
      comets.update({
        dt,
        t,
        cx: zoomCenter.x,
        cy: zoomCenter.y,
        rs: starUniforms.uRs.value as number,
        vel: velCurrent,
        pr: renderer.getPixelRatio(),
      });
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  function doDispose() {
    disposed = true;
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("blur", onPointerLeave);
    window.removeEventListener("pointercancel", onPointerLeave);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return publicHandle;
}
