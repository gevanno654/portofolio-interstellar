import { useGsapScope } from "../hooks/useGsapScope";
import { useDesktop } from "../hooks/useDesktop";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import "./Hero.css";

/* Pecah teks jadi span per karakter (visual saja; aria disembunyikan,
   label utuh tetap di aria-label h1). Spasi jadi nbsp agar tak collapse. */
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

export default function Hero() {
  const reduced = useReducedMotion();
  const desktop = useDesktop();

  const ref = useGsapScope<HTMLElement>((_ctx, scope) => {
    if (reduced) return;

    // Intro PER KARAKTER: tiap .char naik dari baseline mask (.line),
    // stagger 0.035 agar loncatan per huruf terbaca (bukan per kata).
    // Scroll-hint dianimasikan via ANAKNYA
    // (teks + garis), BUKAN wrapper .hero-scroll — wrapper dimiliki penuh
    // oleh timeline exit (scrub). Dua timeline menulis properti opacity
    // pada elemen yang SAMA = perebutan inline style → hint bisa stuck 0
    // saat load. Anak vs wrapper = kepemilikan terpisah, deterministik.
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-name .char", { yPercent: 115, duration: 0.9, stagger: 0.035 }, 0.25)
      .from(".hero-role .char", { yPercent: 115, duration: 0.8, stagger: 0.018 }, 0.85)
      .from(".hero-meta-rule", { scaleX: 0, transformOrigin: "left center", duration: 0.9 }, 0.65)
      .from(".hero-scroll-text, .hero-scroll-line", { opacity: 0, y: 10, duration: 0.7, stagger: 0.08, clearProps: "all" }, 1.15);
    // Catatan: tl otomatis terdaftar dalam context ini — revert() membersihkannya.

    // IDLE DENYUT ala moncy (split-h2): baris GEVANNO YOH dipecah per huruf
    // (sudah .char dari Chars()). Tiap huruf punya timeline KECIL mandiri:
    // naik (→ -115, 0.35) → teleport ke bawah (set +115) → LANGSUNG masuk
    // (→ 0, 0.35). Kesepuluh timeline di-stagger 0.09 (efek "ular": G mulai
    // t=0 selesai penuh t=0.7; A mulai t=0.09; H selesai t≈1.5).
    // G tak menunggu H — tiap huruf masuk tepat setelah ia selesai naik.
    // Teks SAMA. Hening 7.5 → ulang SELAMANYA (repeat:-1). Kepemilikan
    // terpisah: idle menulis .char nama; exit menulis .hero-content —
    // tak berebut. delay 2.0: intro selesai 1.815 → margin ~0.2 dtk.
    // Mask .line overflow:hidden memotong huruf ±115% (efek moncy).
    const NAME_CHARS = ".line-name-main .char, .line-name-sub .char";
    const roll = gsap.timeline({ repeat: -1, delay: 2.0, defaults: { ease: "power2.inOut" } });
    document.querySelectorAll(NAME_CHARS).forEach((el, i) => {
      const one = gsap.timeline()
        .to(el, { yPercent: -115, duration: 0.35 })
        .set(el, { yPercent: 115 })
        .to(el, { yPercent: 0, duration: 0.35 });
      roll.add(one, i * 0.09);
    });
    roll.to({}, { duration: 7.5 }); // hening: jeda antar siklus
    // Pause roll saat hero keluar viewport (hemat tick: roll tetap jalan
    // walau hero opacity 0 = 10 target idle). onLeave/onLeaveBack → pause,
    // onEnter/onEnterBack → resume. Daftar di context agar ikut revert
    // (cleanup kill+set tetap).
    ScrollTrigger.create({
      trigger: scope ?? undefined,
      start: "top bottom",
      end: "bottom top",
      onLeave: () => roll.pause(),
      onLeaveBack: () => roll.pause(),
      onEnter: () => roll.play(),
      onEnterBack: () => roll.play(),
    });

    // HERO EXIT + dissolve: seluruh .hero-content tenggelam ke bawah
    // (+40% ala moncy.dev tl1) + fade CEPAT 1→0 (lenyap di Y~450, sisa pin
    // milik about bersih). Ease none: moncy apa adanya (probe gate lolos
    // Y450+. power1.out melandai = heroOp 0.44 di Y450, gate telat fire).
    if (desktop) {
      // MASTER = HERO EXIT + PIN OVERLAP (dissolve menyatu, tanpa zona
      // mati): hero DIAM 1 viewport (pin, pinSpacing true — dokumen
      // memanjang 100svh memberi ruang dissolve); about menumpuk di
      // atasnya (margin -100svh, lihat About.css).
      // Exit (sink +40% + fade moncy tl1) berjalan DALAM rentang pin.
      // Travel slot + word-rise about memakai rentang pin yang SAMA
      // (dipetakan di Cosmos/About). Mobile/RM: tanpa pin (cabang else).
      const exit = gsap.timeline({
        ease: "none",
        scrollTrigger: {
          trigger: scope ?? undefined,
          start: "top top",
          // Pin 1 viewport = ruang dissolve hero→about (fade+travel).
          // TANPA paruh parkir (lengket dicabut per permintaan): about
          // mengalir natural setelah dissolve.
          end: "+=100%",
          scrub: 0.6,
          pin: true,
          pinSpacing: true,
        },
      });
      exit
        // Scroll-hint: fromTo eksplisit (1→0) + immediateRender:false.
        // Di progress 0: opacity 1 (ikut intro anak, tak tersentuh).
        // (.to biasa merekam start saat intro anak masih 0 → stuck hilang.)
        // Anak (.hero-scroll-text/line) hanya untuk INTRO; wrapper hanya
        // untuk EXIT — tak ada perebutan inline style.
        // Scroll-hint: opacity-only di timeline. Gerak (y) dimiliki
        // Smoother effects via data-speed="0.85" — dua penulis transform
        // (tween y + effects) = perebutan per tick. Opacity vs transform
        // = kepemilikan terpisah, deterministik.
        .fromTo(".hero-scroll", { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.5, immediateRender: false }, 0)
        // OUT TEKS MURNI moncy.dev (GsapScroll.ts tl1 — karakter diabaikan):
        //   .to(".landing-container", { opacity: 0, duration: 0.4 }, 0)
        //   .to(".landing-container", { y: "40%", duration: 0.8 }, 0)
        // Satu target utuh (.hero-content = padanan .landing-container),
        // satu timeline scrub, SATU tween gerak +40% (ke bawah, 40%
        // tinggi konten — besaran moncy apa adanya, tanpa penyesuaian
        // arah/rentang). Ease power1.out: mulai penuh lalu melandai
        // hingga berhenti lembut (tanpa ease = kecepatan konstan lalu
        // berhenti mendadak di ujung = terasa kasar).
        // Fade CEPAT ala moncy (0.4/0.8, durasi total 2.0): hero lenyap
        // total di Y~450, sisa pin milik about bersih. Ease none (moncy
        // apa adanya): gate rect (heroOp ≤ 0.05) lolos di Y450+.
        .to(".hero-content", { yPercent: 40, force3D: true, ease: "none", duration: 0.8 }, 0)
        .to(".hero-content", { opacity: 0, ease: "none", duration: 0.4 }, 0);
      // About (headline, reveal, kata, Taurus) DICABUT dari master —
      // masing-masing punya trigger viewport sendiri (About/Topography).
    } else {
      const exit = gsap.timeline({
        ease: "none",
        scrollTrigger: { trigger: scope ?? undefined, start: "top top", end: "65% top", scrub: true },
      });
      exit
        .fromTo(".hero-scroll", { y: 0, opacity: 1 }, { y: -16, opacity: 0, ease: "none", duration: 1, immediateRender: false }, 0)
        // Mobile tanpa pin/dolly: padanan moncy (satu tween +40% + fade),
        // skala penuh scrub — besaran dan ease default seperti aslinya.
        .to(".hero-content", { yPercent: 40, force3D: true, duration: 1.6 }, 0)
        .to(".hero-content", { opacity: 0, duration: 0.8 }, 0);
    }

    // Cleanup idle (dilepas SETELAH ctx.revert oleh useGsapScope).
    return () => {
      roll.kill();
      gsap.set(NAME_CHARS, { yPercent: 0 });
    };
  }, [reduced, desktop]);

  return (
    <section ref={ref} className="hero" id="top" aria-label="Introduction">
      <div className="hero-content">
          <h1 className="hero-name display" aria-label="Hello, I'm Gevanno Yoh">
            <span className="line line-hello">
              <span className="line-inner">
                <Chars text="Hello! I'm" />
              </span>
            </span>
            <span className="line line-name-main">
              <span className="line-inner">
                <Chars text="Gevanno" />
              </span>
            </span>
            <span className="line line-name-sub">
              <span className="line-inner">
                <Chars text="Yoh" />
              </span>
            </span>
          </h1>
          <div className="hero-meta">
            <span className="hero-meta-rule" aria-hidden="true" />
            <p className="hero-role" aria-label="A fullstack developer">
              <span className="line">
                <span className="line-inner">
                  <Chars text="A fullstack developer" />
                </span>
              </span>
            </p>
          </div>
      </div>

      {/* Parallax Smoother (bukti effects:true jalan): hint melayang lebih
          lambat dari scroll. Teks utama JANGAN diberi efek (ikut timeline). */}
      <a href="#about" className="hero-scroll" data-speed="0.85" aria-label="Scroll to about section">
        <span className="hero-scroll-text">Scroll to explore the world</span>
        <span className="hero-scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
