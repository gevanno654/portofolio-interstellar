import { useLayoutEffect, useRef, type DependencyList } from "react";
import { gsap } from "../lib/gsap";

/* Scope GSAP ke satu subtree + auto-cleanup.
   Aman untuk React StrictMode: ctx.revert() menghapus semua
   tween/ScrollTrigger yang dibuat di dalamnya saat unmount
   maupun saat effect di-invoke ulang.
   Callback menerima (ctx, scopeEl) — pakai scopeEl sebagai
   trigger ScrollTrigger bila targetnya root section itu sendiri,
   karena string selector di dalam context hanya cocok descendant.
   Setup boleh me-return fungsi cleanup tambahan (mis. melepas
   gsap.ticker global yang tak ikut ctx.revert) — dipanggil saat
   cleanup effect, setelah ctx.revert(). */
export function useGsapScope<T extends HTMLElement>(
  setup: (ctx: gsap.Context, scopeEl: T | null) => void | (() => void),
  deps: DependencyList = [],
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    let cleanup: void | (() => void);
    const ctx = gsap.context((c) => {
      cleanup = setup(c, ref.current);
    }, ref);
    return () => {
      ctx.revert();
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
