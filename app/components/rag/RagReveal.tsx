"use client";

import { useLayoutEffect } from "react";

/*
 * Fade-up on scroll, as an enhancement only:
 * - Content is visible by default (server HTML, no JS, reduced motion).
 * - Once this runs, only elements still well below the fold start hidden.
 * - rootMargin reveals them ~30% of a screen BEFORE they enter the viewport.
 * - Anything the visitor has already scrolled past (fast scroll, anchor
 *   jumps) is revealed immediately, so the screen is never left blank.
 */
export default function RagReveal() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".rag-motion");
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const show = (element: Element) => element.classList.add("is-visible");
    const nearOrAbove = (element: Element) =>
      element.getBoundingClientRect().top < window.innerHeight * 1.3;

    // Already on (or near) screen: visible straight away, no animation flash.
    const pending = elements.filter((element) => {
      if (nearOrAbove(element)) {
        show(element);
        return false;
      }
      return true;
    });

    root.dataset.motion = "on";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            show(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px 30% 0px" }
    );
    pending.forEach((element) => observer.observe(element));

    // Safety net for very fast scrolls: reveal everything above the fold.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        for (const element of pending) {
          if (!element.classList.contains("is-visible") && nearOrAbove(element)) {
            show(element);
            observer.unobserve(element);
          }
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
