/* ————————————————————————————————————————————————
   shoot.mjs · verifikasi visual lewat Chrome DevTools Protocol.

   Headless Chrome + --virtual-time-budget membekukan GSAP di
   frame 0, jadi harness ini mengemudikan Chrome sungguhan:
   navigasi → tunggu → screenshot pada posisi scroll tertentu.

   Pakai: node scripts/shoot.mjs <baseUrl> <outDir>
   ———————————————————————————————————————————————— */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173";
const OUT = process.argv[3] ?? "shots";
const PORT = 9333;

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome/Edge found");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* belum siap */
    }
    await sleep(250);
  }
  throw new Error("CDP target tidak muncul");
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  return { ready, send, close: () => ws.close() };
}

async function shot(cdp, name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(path.join(OUT, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`  ✓ ${name}.png`);
}

async function evaluate(cdp, expression) {
  const r = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.value;
}

const args = [
  `--remote-debugging-port=${PORT}`,
  "--headless=new",
  "--hide-scrollbars",
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--no-first-run",
  "--no-default-browser-check",
  "--user-data-dir=" + path.resolve(OUT, ".chrome-profile"),
  "about:blank",
];

const proc = spawn(chrome, args, { stdio: "ignore" });

try {
  await mkdir(OUT, { recursive: true });
  const wsUrl = await waitForTarget();
  const cdp = connect(wsUrl);
  await cdp.ready;

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const VIEWS = [
    { name: "desktop", w: 1440, h: 900 },
    { name: "mobile", w: 390, h: 844 },
  ];

  for (const v of VIEWS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: v.w,
      height: v.h,
      deviceScaleFactor: 1,
      mobile: v.name === "mobile",
    });

    await cdp.send("Page.navigate", { url: BASE });
    await sleep(4200); // font + GSAP intro + WebGL chunk

    const diag = await evaluate(
      cdp,
      `(() => {
        const c = document.querySelector('.hero-stage-canvas canvas');
        const hero = document.querySelector('.hero-name');
        return {
          canvas: !!c,
          canvasW: c ? c.width : 0,
          canvasH: c ? c.height : 0,
          heroVisible: hero ? getComputedStyle(hero).opacity : null,
          scrollY: window.scrollY,
          docH: document.documentElement.scrollHeight,
          noWebgl: document.documentElement.classList.contains('no-webgl'),
        };
      })()`,
    );
    console.log(`[${v.name}]`, JSON.stringify(diag));

    await shot(cdp, `${v.name}-00-hero`);

    // Turun sedikit: lubang mulai memadat, bust memudar
    await evaluate(cdp, `window.scrollTo(0, window.innerHeight * 0.35)`);
    await sleep(1400);
    await shot(cdp, `${v.name}-01-emerge`);

    await evaluate(cdp, `window.scrollTo(0, window.innerHeight * 0.9)`);
    await sleep(1400);
    await shot(cdp, `${v.name}-02-horizon`);

    await evaluate(cdp, `window.scrollTo(0, window.innerHeight * 1.6)`);
    await sleep(1400);
    await shot(cdp, `${v.name}-03-about`);
  }

  // Reduced motion: fallback statis
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: BASE });
  await sleep(3500);
  const rm = await evaluate(
    cdp,
    `(() => ({
      canvas: !!document.querySelector('.hero-stage-canvas canvas'),
      fallbackImg: !!document.querySelector('.hero-stage-fallback'),
    }))()`,
  );
  console.log("[reduced-motion]", JSON.stringify(rm));
  await shot(cdp, "reduced-hero");

  cdp.close();
} catch (err) {
  console.error("FAIL:", err.message);
  process.exitCode = 1;
} finally {
  proc.kill();
}
