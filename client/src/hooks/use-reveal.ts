import { useEffect } from "react";

/**
 * Fades in elements marked with `data-reveal` as they scroll into view,
 * including elements rendered later (e.g. after data loads).
 * Content stays visible when JS, IntersectionObserver or motion is unavailable.
 */
export function useReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || !("MutationObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-reveal");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.getBoundingClientRect().top < window.innerHeight * 0.94) el.classList.add("is-visible");
        else io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      document.documentElement.classList.remove("js-reveal");
    };
  }, []);
}
