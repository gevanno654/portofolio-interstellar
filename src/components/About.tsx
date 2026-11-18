import { about } from "../content";
import { useDesktop } from "../hooks/useDesktop";
import { useGsapScope } from "../hooks/useGsapScope";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import "./About.css";

/* Pecah teks jadi span per karakter (salin pola Hero.tsx — satu bahasa
   gerak teks di seluruh situs; spasi jadi nbsp agar tak collapse). */
function Chars({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span key={i} className="char" aria-hidden="true">
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

/* Pecah teks jadi span per kata (untuk rise bermasker bio/sinyal):
   tiap kata .word di dalam .wmask (mask descender); spasi string antar
   mask agar bungkus baris natural. Label utuh di aria-label orangtua. */
function Words({ text }: { text: string }) {
  const parts = text.split(" ");
  return (
    <>
      {parts.map((w, i) => (
        <span key={i}>
          <span className="wmask" aria-hidden="true">
            <span className="word">{w}</span>
          </span>
          {i < parts.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function About() {
  const reduced = useReducedMotion();
  const desktop = useDesktop();

  const ref = useGsapScope<HTMLElement>((_ctx, scope) => {
    if (reduced || !scope) return;
    // Intro headline PER HURUF (seperti intro hero): tiap .char naik dari
    // baseline mask. TIME-BASED once (bukan scrub): play saat tl mulai,
    // latch introDone → roll. Tak mengikuti scroll — selalu pas.
    // PENTING: roll dibuat SEBELUM intro — onComplete intro callback
    // butuh roll sudah terisi (TDZ bila dibalik).
    const HEAD_CHARS = ".about-headline .char";
    // IDLE ULAR persis hero: tiap huruf paket mandiri (naik 0.35 →
    // set +115 → langsung masuk 0.35), stagger 0.09, hening 7.5,
    // repeat:-1, paused:true (di-play onUpdate di bawah). Pause saat
    // about keluar viewport (hemat tick, salin pola hero).
    const roll = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power2.inOut" } });
    document.querySelectorAll(HEAD_CHARS).forEach((el, i) => {
      const one = gsap.timeline()
        .to(el, { yPercent: -115, duration: 0.35 })
        .set(el, { yPercent: 115 })
        .to(el, { yPercent: 0, duration: 0.35 });
      roll.add(one, i * 0.09);
    });
    roll.to({}, { duration: 7.5 }); // hening: jeda antar siklus
    // Gate intro: roll hanya boleh jalan setelah intro scrub selesai.
    // onEnter pause-trigger bisa fire LEBIH DULU (start "top bottom" di
    // atas "top 88%") → guard flag agar tak play sebelum waktunya.
    let introDone = false;
    const tryPlay = () => {
      if (introDone) roll.play();
    };
    // ENTRANCE (alir natural): tl viewport milik section —
    // about di flow normal, geometri jujur. Headline fade h2 (gsap.set 0
    // di setup + to di tl); kata rise 110→0 power2.out stagger 0.006
    // (gelombang tumpang tindih, bukan antre mekanis). Kontainer .reveal
    // TAK di-tween: fade blok + rise kata = ghosting dua lapis.
    // Intro char TIME-BASED once (bukan scrub): play saat tl mulai
    // (progress>0.05, flag introPlayed), lalu latch introDone → roll.
    // Tak lagi mengikuti scroll — selalu pas, seperti hero.
    gsap.set(".about-headline", { opacity: 0 });
    // Headline FADE time-based (bukan scrub): muncul LANGSUNG sekali-main
    // bareng intro char — tak mengikuti scroll (keluhan: headline ikut
    // scroll, tak pas). Scroll balik tak memundurkannya (once; di bawah
    // fold tak terlihat, kembali terlihat = sudah penuh).
    const headFade = gsap.to(".about-headline", {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
      paused: true,
    });
    // PANGGUNG KOSONG + JATUH DARI ATAS (dua ketukan):
    // Selama pin (0–900) teks disembunyikan TOTAL (.about-text opacity 0,
    // bukan mask saja): ketuk 1 = hanya lubang travel. Di ujung pin
    // (tryFire: hero lenyap + sisa pin ≤ 200px) container fade-in + headline
    // char + bio/sinyal word JATUH dari atas (-115/-110 → 0), berurutan
    // headline → bio → sinyal, time-based once (selalu pas, tak ikut
    // kecepatan scroll). Mask .line/.wmask tetap overflow-hidden, hanya
    // arah masuk dibalik. Reset saat kembali ke atas (Y≤36) agar replay
    // dari bersih. Mobile: trigger viewport natural, pola sama.
    gsap.set(".about-text", { opacity: 0 });
    gsap.set(".about-headline", { opacity: 0 });
    // State awal kata di ATAS mask (jatuh ke 0, bukan naik dari 110).
    gsap.set(".about-text .word", { yPercent: -110 });
    let introPlayed = false;
    const intro = gsap.from(HEAD_CHARS, {
      yPercent: -115,
      duration: 0.9,
      stagger: 0.035,
      ease: "power3.out",
      paused: true,
      onComplete: () => {
        introDone = true;
        roll.play();
      },
    });
    // Kata bio/sinyal jatuh berurutan SETELAH headline (delay 0.5):
    // gelombang tumpang tindih (stagger 0.006), melandai power2.out.
    const wordDrop = gsap.to(".about-text .word", {
      yPercent: 0,
      duration: 0.7,
      stagger: 0.006,
      ease: "power2.out",
      paused: true,
    });
    // EXIT B (time-based once, disetujui 2026-11-18; revisi2: ambang maju ke
    // Y1200 — bukti screenshot: di Y1600 about sudah keluar frame (viewport
    // hanya sisa 200px bawah), animasi jalan di area tak terlihat. Di Y1200
    // about masih ~penuh di layar (probe headTop −52) → koreografi terbaca.
    // Durasi ±1.8 dtk: kata 1.0 (delay 0) → char 1.2 (delay 0.5, stagger
    // 0.05) → container fade 1.0 (delay 0.8). LUBANG: fade 1.2 dtk ke 0.15
    // via setHoleVis. Desktop saja (mobile/RM: alir natural). Reset dekat:
    // scroll < Y1000 (= kembali ke tengah dari bawah) replay bersih.
    let exitPlayed = false;
    const exitState = { hole: 1 };
    // Tween anonim exit (container fade + lubang) WAJIB terlacak agar
    // resetEntrance bisa kill: tanpa ini, fade exit basi menimpa replay
    // entrance (teks replay → 1 lalu dipaksa 0 oleh tween basi).
    const outro = gsap.to(HEAD_CHARS, {
      yPercent: -115,
      duration: 1.2,
      stagger: 0.05,
      ease: "power3.in",
      paused: true,
      delay: 0.5,
    });
    const wordRise = gsap.to(".about-text .word", {
      yPercent: -110,
      duration: 1.0,
      stagger: 0.008,
      ease: "power2.in",
      paused: true,
    });
    // ROOT CAUSE (probe-fixed 2026-11-18): di T0 wordY masih -44.8 =
    // entrance BELUM SELESAI saat anchor mendarat, tapi tryExit langsung
    // fire di Y1200 → outro/wordRise tabrakan dengan intro/wordDrop yang
    // masih jalan (char rewind 0→-55→0, kata macet -44.8, container fade
    // ke 0 duluan). Hasil: teks lenyap TANPA koreografi naik-menghilang.
    // SOLUSI (revisi): JADWAL, bukan flag — exit dijadwalkan SELALU di
    // belakang entrance siklus ini via timer dari tryFire (3.0dtk ≈
    // entrance terpanjang 1.65dtk + margin). Reset membatalkan jadwal
    // basi (clearTimeout). Tak ada flag basi yang bisa lolos.
    // SYARAT GANDA di tryExit: timer matang (exitArmed) DAN scroll ≥1200.
    // Timer saja tanpa scroll = user diam di tengah → exit tak fire.
    // Scroll saja tanpa timer = entrance belum selesai → tunggu.
    let exitArmed = false;
    let exitTimer: number | undefined;
    const tryExit = () => {
      if (exitPlayed || !exitArmed) return;
      // Ambang 1100 (maju dari 1200): transisi mulai sedikit lebih awal —
      // scroll untuk exit lebih pendek, teks masih penuh di frame (probe
      // headBox +48 di Y1100) sehingga koreografi terbaca.
      if ((window.scrollY || 0) >= 1100) {
        exitPlayed = true;
        roll.pause();
        wordDrop.pause();
        gsap.to(".about-text", { opacity: 0, duration: 1.0, delay: 0.8, ease: "power1.out" });
        outro.play();
        wordRise.play();
        exitState.hole = 1;
        gsap.to(exitState, {
          hole: 0.15,
          duration: 1.2,
          ease: "power1.out",
          onUpdate: () => {
            try {
              (window as unknown as { __sceneHandle?: { setHoleVis: (v: number) => void } }).__sceneHandle?.setHoleVis(exitState.hole);
            } catch { /* abaikan */ }
          },
        });
      }
    };
    // GATE ENTRANCE: hero lenyap (heroOp ≤ 0.05) DAN posisi about sudah
    // dekat tengah: rect top #about ≤ 40% viewport. BUKAN scroll absolut
    // (rapuh per tinggi layar) atau sisa-pin (anchor "top center" mendarat
    // LEWAT ujung pin di layar pendek — sisa negatif = tak lolos).
    // Rect elemen = jujur di semua layar + semua jalur (manual/anchor).
    // Polling 150ms (anti-lompat). Latch introPlayed = sekali main.
    const tryFire = () => {
      const heroEl = document.querySelector(".hero-content");
      const heroOp = heroEl ? parseFloat(getComputedStyle(heroEl).opacity || "1") : 1;
      const aboutTop = document.getElementById("about")?.getBoundingClientRect().top ?? 9999;
      if (heroOp <= 0.05 && aboutTop <= window.innerHeight * 0.4 && !introPlayed) {
        introPlayed = true;
        introDone = false;
        exitPlayed = false;
        // Jadwalkan exit SELALU di belakang entrance siklus ini: 3.0dtk ≈
        // entrance terpanjang (1.65dtk) + margin scroll manusiawi. Jadwal
        // basi siklus sebelumnya dibatalkan dulu (clearTimeout + disarm).
        window.clearTimeout(exitTimer);
        exitArmed = false;
        exitTimer = window.setTimeout(() => {
          exitArmed = true;
        }, 3000);
        gsap.to(".about-text", { opacity: 1, duration: 0.4, ease: "power2.out" });
        headFade.play();
        intro.play(0);
        wordDrop.play(0);
      }
    };
    // DESKTOP: rentang PIN hero (start 0 / end 900 = pin 1 viewport).
    // tl HANYA me-reset bila dissolve dibatalkan (progress → 0):
    // semua entrance (container fade, headline, kata) time-based once
    // di tryFire/wordDrop — tak lagi scrub mengikuti scroll.
    // Mobile: fire sekali saat teks masuk viewport (tanpa syarat scroll).
    const resetTrigger = gsap.timeline({
      ease: "none",
      scrollTrigger: desktop
        ? {
            trigger: document.querySelector(".hero"),
            start: 0,
            end: 900,
            scrub: 0.6,
            onUpdate: (self) => {
              if (self.progress <= 0.02 && introPlayed) {
                resetEntrance();
              }
            },
          }
        : {
            trigger: ".about-text",
            start: "top 85%",
            end: "top 40%",
            scrub: 0.6,
            onUpdate: (self) => {
              if (self.progress > 0.05 && !introPlayed) {
                introPlayed = true;
                gsap.to(".about-text", { opacity: 1, duration: 0.4, ease: "power2.out" });
                headFade.play();
                intro.play();
                wordDrop.play();
              }
            },
          },
    });
    // HOLD keyframes DICABUT — resetTrigger murni (tanpa tween), pola
    // RESET dissolve lama yang terbukti jalan (progress → 0 = reset).
    void resetTrigger;
    const resetEntrance = () => {
      introPlayed = false;
      introDone = false;
      exitPlayed = false;
      exitArmed = false;
      window.clearTimeout(exitTimer);
      intro.pause(0);
      outro.pause(0);
      headFade.pause(0);
      wordDrop.pause(0);
      wordRise.pause(0);
      roll.pause(0);
      try {
        (window as unknown as { __sceneHandle?: { setHoleVis: (v: number) => void } }).__sceneHandle?.setHoleVis(1);
      } catch { /* abaikan */ }
      gsap.set(".about-text", { opacity: 0 });
      gsap.set(".about-headline", { opacity: 0 });
      gsap.set(HEAD_CHARS, { yPercent: 0 });
      gsap.set(".about-text .word", { yPercent: -110 });
    };
    // RESET dissolve: ScrollTrigger murni (tanpa tween) — me-reset bila
    // dissolve dibatalkan (progress → 0). Semua entrance time-based once
    // di tryFire/wordDrop, tak lagi scrub mengikuti scroll.
    ScrollTrigger.create({
      trigger: document.querySelector(".hero"),
      start: 0,
      end: 900,
      ...(desktop
        ? {
            onUpdate: (self) => {
              if (self.progress <= 0.02 && introPlayed) {
                resetEntrance();
              }
            },
          }
        : {
            trigger: ".about-text",
            start: "top 85%",
            end: "top 40%",
            onUpdate: (self) => {
              if (self.progress > 0.05 && !introPlayed) {
                introPlayed = true;
                gsap.to(".about-text", { opacity: 1, duration: 0.4, ease: "power2.out" });
                headFade.play();
                intro.play();
                wordDrop.play();
              }
            },
          }),
    });
    // Pause roll: geometri dokumen jujur lagi (tanpa hold) → trigger
    // viewport scope cukup untuk desktop + mobile.
    ScrollTrigger.create({
      trigger: scope,
      start: "top bottom",
      end: "bottom top",
      onLeave: () => roll.pause(),
      onLeaveBack: () => roll.pause(),
      onEnter: tryPlay,
      onEnterBack: tryPlay,
    });
    // Polling 150ms anti-lompat (onUpdate scrub fire sekali saat scroll
    // instan). Latch introPlayed = entrance sekali main; exitPlayed =
    // exit sekali main (fire di Y1600, scroll balik = tetap hilang).
    // RESET DEKAT (revisi keluhan "harus ke paling atas"): scroll < Y1400
    // (= about kembali ke tengah dari bawah) = entrance replay dari bersih.
    // Y≤36 tetap tercakup (< 1400). Anchor nav reset paksa seperti biasa.
    // RESET (perbaikan loop 2026-11-18): syarat LAMA `scrollY < 1000`
    // me-reset SETIAP 150ms saat diam di tengah (Y900 < 1000) → entrance
    // restart terus, kata tak pernah jatuh penuh (probe SIAP wordY=-45
    // setelah 3.5dtk stabil). Syarat BENAR: reset hanya bila kembali dari
    // BAWAH setelah exit (exitPlayed) ATAU ke hero (Y≤36). Diam di tengah
    // (Y900, exit belum fire) = jangan sentuh.
    const poll = window.setInterval(() => {
      if (!introPlayed) {
        tryFire();
      } else if (!exitPlayed) {
        tryExit();
      }
      const y = window.scrollY || 0;
      if (introPlayed && y < 1000 && (exitPlayed || y <= 36)) {
        resetEntrance();
      }
    }, 150);
    // ANCHOR REPLAY: klik nav #about = entrance replay bersih (reset paksa
    // SEBELUM smoother melompat ke ujung pin).
    const onNavAbout = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('a[href="#about"]');
      if (!(el instanceof HTMLAnchorElement)) return;
      resetEntrance();
    };
    document.addEventListener("click", onNavAbout);
    // Cleanup (dilepas SETELAH ctx.revert oleh useGsapScope).
    return () => {
      document.removeEventListener("click", onNavAbout);
      window.clearInterval(poll);
      window.clearTimeout(exitTimer);
      roll.kill();
      intro.kill();
      outro.kill();
      headFade.kill();
      wordDrop.kill();
      wordRise.kill();
      gsap.set(HEAD_CHARS, { yPercent: 0 });
    };
  }, [reduced, desktop]);

  return (
    <section ref={ref} className="section about about-flush" id="about" aria-label="About me">
      <div className="section-inner">
        {/* Tag "01 // Transmission" DIHAPUS per permintaan. */}

        <div className="about-grid">
          {/* Kiri: KOSONG — panggung lubang travel (slot fixed kiri
             viewport). Taurus dicabut (pindah section lain). */}
          {/* Kanan: headline mask+Chars (gradasi + idle persis hero). */}
          <div className="about-text">
            <h2 className="display about-headline" aria-label="About Me.">
              <span className="line" aria-hidden="true">
                <span className="line-inner">
                  <Chars text="About Me." />
                </span>
              </span>
            </h2>
            <p className="lede about-sub" aria-label={about.subtitle}>
              <Words text={about.subtitle} />
            </p>
            <p className="about-signal">
              {/* Tag ikut wordRise/wordDrop: tanpa mask .word ia lolos exit
                  (container fade delay 0.55 = masih terbaca saat section
                  berikut masuk). Pola sama: .wmask + .word. */}
              <span className="wmask" aria-hidden="true">
                <span className="word about-signal-tag">▸ SIGNAL // 0047</span>
              </span>
              <br />
              <span aria-label={about.quote}>
                <Words text={about.quote} />
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
