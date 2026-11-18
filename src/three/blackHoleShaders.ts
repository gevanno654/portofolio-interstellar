/* ————————————————————————————————————————————————
   blackHoleShaders.ts · GLSL untuk black hole + bintang.
   Semua visual utama bersifat prosedural — tanpa tekstur.
   ———————————————————————————————————————————————— */

export const QUAD_VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

export const HOLE_FRAG = /* glsl */ `
  precision highp float;

  uniform vec2 uRes;
  uniform float uTime;
  uniform float uScroll;    // (tak dipakai — resesi dimatikan, terkunci slot)
  uniform float uHoleVis;   // 1 penuh di hero, fade 0 saat about masuk
  uniform vec2 uPointer;    // -1..1, sudah di-lerp di CPU
  uniform float uRsBase;    // (tak dipakai — radius dari uAnchorRs slot)
  uniform float uAnchorRs;  // radius bayangan mode hero (dari lebar slot)
  uniform float uCenterY;   // (tak dipakai — pusat dari uAnchor slot)
  uniform vec2 uAnchor;     // pusat slot hero dalam ruang-q (diukur CPU)
  uniform float uAnchorMix; // 1 = tampil di hero, 0 = fade (about masuk)
  uniform float uDolly;   // 0 di hero → 1 di notch-1 (zoom mendekat, moncy)
  uniform float uZoom;    // 0 di hero → 1 mid-scroll: pusat ke tengah + scale-up sinematik (moncy: karakter ke pusat + kamera dolly)
  uniform vec2 uPar;        // parallax tilt -1..1 (di-lerp CPU, ~0.45s)
  uniform float uMirror;    // 0 hero (+15°) → 1 about (−15°), di-lerp CPU

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float asp = uRes.x / uRes.y;

    // Ruang layar terkoreksi aspek, origin di tengah
    vec2 q = vec2((uv.x - 0.5) * asp, uv.y - 0.5);

    // Pusat lubang TERKUNCI di slot hero (tidak berpindah ke about/skills).
    // uAnchor diukur CPU dari slot tiap frame → lubang scroll alami
    // bersama hero, lalu fade via uHoleVis (tanpa mode jauh/Cfar).
    // Parallax 3D: pusat + sumbu miring ikut uPar (subtil, di-lerp CPU).
    // Zoom sinematik (moncy: karakter ke pusat + kamera dolly): uZoom
    // 0→1 menggeser pusat dari slot 35% menuju tengah + scale-up 0.35x.
    // Komposisi dijaga: teks kiri tetap terbaca (hole tak menelan layar).
    vec2 C0 = uAnchor + vec2(uPointer.x * 0.006, uPointer.y * 0.004) + uPar * 0.03;
    vec2 C = mix(C0, vec2(0.0, 0.0), uZoom * 0.35);
    vec2 d = q - C;

    // Proyeksi bidang disk yang dimiringkan (inklinasi ~72deg),
    // diputar +15° di hero → CERMIN −15° di about (uMirror 0→1):
    // sumbu panjang naik-ke-kanan vs naik-ke-kiri — berlawanan simetris.
    // uPar menggeser sumbu ±3° di sekitar basis berjalan (bukan blink:
    // uMirror di-lerp CPU ~0.45s dari progress travel).
    float tiltBase = mix(15.0, -15.0, uMirror);
    float tilt = radians(tiltBase + uPar.x * 3.0);
    // pola di-sampling dengan koordinat yang diputar balik agar sumbu
    // panjang naik ke kanan (hero) / kiri (about). dT dipakai untuk bentuk
    // disk + depan/belakang + busur (ikut miring); bayangan tetap lingkaran
    // dari d (tidak miring).
    // uPar menggeser sumbu ±3° di sekitar basis berjalan + kemiringan
    // bidang ±6%.
    float ct = cos(tilt);
    float st = sin(tilt);
    vec2 dT = vec2(ct * d.x + st * d.y, -st * d.x + ct * d.y);
    float incline = 2.9 * (1.0 + uPar.y * 0.06);
    vec2 dp = vec2(dT.x, dT.y * incline);
    float r = length(dp);
    float ang = atan(dp.y, dp.x);

    float Rs = uAnchorRs * (1.0 + 0.35 * uDolly) * (1.0 + 0.35 * uZoom);
    float inner = Rs * 1.22;
    float outer = Rs * 3.2;

    // ——— Pita disk dengan rotasi RIGID (stabil long-open) ———
    // SEAMLESS: ang (±π) → cos/sin (periodik, tanpa garis potong).
    // STABIL: rot = uTime*0.18 SAMA untuk semua r (solid-body rotation).
    // Alasan: rot lama ∝1/r (diferensial pada FASE noise) membuat beda
    // fase antar-radius tumbuh linear dengan waktu → spiral terpuntir
    // makin ketat → garis-garis konsentris rapat seperti gambar 2.
    // Itu bukan bocor (aman, tanpa growth memori) tapi winding visual.
    // Rasa diferensial dipertahankan via wobble BOUNDED ±0.2 rad
    // (0.2*sin(...), tak menumpuk) + debu partikel yang tetap ∝1/r
    // (partikel diskrit tak winding). Suku radial STATIS (r*9, r*4.5)
    // + napas bounded ±0.25 → pola hanya BERPUTAR (periode ~35 dtk).
    float band = smoothstep(inner, inner + Rs * 0.5, r)
               * (1.0 - smoothstep(outer - Rs * 1.1, outer, r));
    float rot = uTime * 0.18;
    float wob = 0.2 * sin(uTime * 0.3 - r * 6.0);
    vec2 ca = vec2(cos(ang + rot + wob), sin(ang + rot + wob)) * 2.2;
    vec2 rc = vec2(r * 9.0, r * 4.5)
            + 0.25 * vec2(sin(uTime * 0.10 + r * 4.0), cos(uTime * 0.08 + r * 3.0));
    float streak = fbm(ca + rc);
    band *= (0.5 + 0.5 * streak) * 0.8;

    // Doppler beaming: sisi yang mendekat lebih terang (dibatasi agar
    // tidak clipping). Parallax menggeser hotspot ±8% mengikuti uPar
    // (kesan volume: cahaya ikut sudut pandang, bukan statis).
    float doppler = 1.0 + 0.55 * clamp((-dp.x + uPar.x * 0.08 * max(r, 1e-3)) / max(r, 1e-3), -1.0, 1.0);
    float disk = band * doppler;

    // Warna disk: inti hampir putih → tepi warm starlight
    vec3 diskCol = mix(
      vec3(1.0, 0.88, 0.70),
      vec3(0.77, 0.64, 0.47),
      smoothstep(inner, outer, r)
    );

    // Sisi jauh (atas) vs sisi dekat (bawah) — ikut kemiringan +15°.
    float front = smoothstep(0.012, -0.012, dT.y);
    float screenR = length(d);
    float shadow = 1.0 - smoothstep(Rs * 0.97, Rs * 1.03, screenR);

    // Redup global tidak dipakai (lubang terkunci di hero).
    float dim = 1.0;

    // Visibilitas lubang: 1 penuh di hero, fade 0 saat #about masuk
    // (diatur CPU via anchorMix → setHoleVis). Tidak ada mode jauh.
    float vis = uHoleVis;

    vec3 col = vec3(0.020, 0.027, 0.051); // deep space

    col += diskCol * disk * (1.0 - front) * dim * vis;      // sisi jauh
    col = mix(col, vec3(0.0, 0.0, 0.0), shadow * vis);      // bayangan menutupi

    // Busur lensa gravitasi di atas bayangan — ikut kemiringan +15°.
    float arc = exp(-pow((screenR - Rs * 1.22) * 8.0, 2.0))
              * smoothstep(0.0, 0.18, dT.y);
    col += diskCol * arc * (0.35 + 0.45 * streak) * dim * vis;

    col += diskCol * disk * front * 1.05 * dim * vis;       // sisi dekat

    // Photon ring — garis tipis terang (ikut pusat parallax via screenR).
    float ring = exp(-pow((screenR - Rs * 1.015) * 30.0, 2.0));
    col += vec3(1.0, 0.86, 0.62) * ring * 1.2 * dim * vis;

    // Halo dingin sangat samar (satu-satunya aksen biru)
    col += vec3(0.32, 0.42, 0.57) * exp(-screenR * 3.4) * 0.10 * dim * vis;

    // Tonemap sinematik — cegah clipping inti, jaga warna hangat
    col = col / (1.0 + col * 0.6);
    col *= 1.25;

    // Vignette saja — grain film DIMATIKAN total per permintaan
    // (masih terlihat seperti "semut" walau sudah 0.008).
    float vig = smoothstep(1.25, 0.35, length(q));
    col *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const STARS_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;
  attribute float aLayer;

  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScroll;   // (tak dipakai — drift dimatikan, terkunci slot)
  uniform float uPixelRatio;
  uniform float uAspect;
  uniform vec2 uMouseUv;   // posisi mouse 0..1 (dari pointer lerp, sinematik)
  uniform float uMouseOn;  // 1 = mouse di dalam & aktif, 0 = pergi (kembali)
  uniform vec2 uSuckCenter; // pusat lubang slot (ruang-q) — target hisap
  uniform float uSuckRad;   // radius pengaruh hisap (ruang-q)
  uniform float uSuckOn;    // 0..1 (fade, dari mix hero)

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    vec3 pos = position;
    float drift = 0.0; // resesi dimatikan — lubang terkunci di slot
    pos.x += uPointer.x * (0.08 + aLayer * 0.10);
    pos.y += uPointer.y * (0.05 + aLayer * 0.07) + drift;

    // Geser lokal: bintang di dekat mouse terdorong menjauh secukupnya
    // hingga TERLIHAT, murni fungsi posisi mouse → otomatis kembali saat
    // mouse pergi (uMouseOn → 0). Radius ±0.24 layar, maks ~1.1 dunia
    // (~5% tinggi layar). X dikali aspek agar dorongan melingkar di layar.
    vec4 mv0 = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip0 = projectionMatrix * mv0;
    vec2 uv0 = clip0.xy / max(clip0.w, 1e-4) * 0.5 + 0.5;
    vec2 diff = uv0 - uMouseUv;
    float mdist = length(vec2(diff.x * uAspect, diff.y));
    float rad = 0.24 + aLayer * 0.06;
    float push = exp(-(mdist * mdist) / (rad * rad)) * uMouseOn;
    vec2 dir = mdist > 1e-4 ? diff / mdist : vec2(0.0);
    float amp = 0.70 + aLayer * 0.40;
    pos.x += dir.x * push * amp * uAspect;
    pos.y += dir.y * push * amp;

    // Hisap radial ke LUBANG SLOT (hero): bintang di sekitar slot
    // tertarik ke pusat jangkar, makin dekat makin cepat + memudar
    // ke hitam di bibir. Murni posisi jangkar → tidak ada state jauh.
    vec2 qpos = vec2((uv0.x - 0.5) * uAspect, uv0.y - 0.5);
    vec2 suck = uSuckCenter - qpos;
    float suckD = length(suck);
    float suckM = exp(-(suckD * suckD) / (uSuckRad * uSuckRad)) * uSuckOn;
    vec2 suckDir = suckD > 1e-4 ? suck / suckD : vec2(0.0);
    // Tarikan ∝ 1/d (kuat di dekat bibir), di-lerp via uSuckOn (fade).
    pos.x += suckDir.x * suckM * (0.25 / max(suckD, 0.08)) * 0.10;
    pos.y += suckDir.y * suckM * (0.25 / max(suckD, 0.08)) * 0.10;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(-mv.z, 0.1);
    gl_PointSize = aSize * uPixelRatio * (16.0 / depth);

    vAlpha = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));
    vColor = aColor;
    vUv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
  }
`;

export const STARS_FRAG = /* glsl */ `
  precision highp float;

  uniform float uAspect;
  uniform vec2 uCenter;
  uniform float uRs;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    // Titik lembut melingkar
    vec2 pc = gl_PointCoord - 0.5;
    float m = smoothstep(0.5, 0.08, length(pc));

    // Bintang di dalam bayangan ikut tertutup lubang
    vec2 q = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
    if (length(q - uCenter) < uRs) discard;

    gl_FragColor = vec4(vColor, m * vAlpha);
  }
`;
