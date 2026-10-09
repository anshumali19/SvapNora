import { useEffect } from "react";
import Lenis from "lenis";

let instance: Lenis | null = null;

/** Scroll to the top of the page, using Lenis when active. */
export function scrollToTop(immediate = true) {
  if (instance) {
    instance.scrollTo(0, { immediate });
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
  }
}

/**
 * Initialize Lenis smooth scrolling for the whole document, respecting
 * reduced-motion preferences and keeping anchors / nested scroll usable.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      autoRaf: false,
    });
    instance = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const target = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector<HTMLElement>(href);
      if (!el) return;
      event.preventDefault();
      lenis.scrollTo(el, { offset: -84 });
      history.replaceState(null, "", href);
    };

    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      instance = null;
    };
  }, []);
}
