"use client";

import { useEffect, useRef } from "react";
import { ragSteps } from "@/app/data/rag-page";

/*
 * Four-node pipeline. A glowing dot travels along the track as the
 * section scrolls through the viewport (horizontal on desktop, vertical
 * on mobile). Progress is written to a CSS variable, so no re-renders.
 */
export default function RagPipeline() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const travel = Math.max(rect.height, viewport * 0.45);
      const progress = Math.min(1, Math.max(0, (viewport * 0.75 - rect.top) / travel));
      const steps = ragSteps.steps.length - 1;

      element.style.setProperty("--progress", progress.toFixed(4));
      element.dataset.reached = String(Math.floor(progress * steps + 0.02));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="rag-pipeline" ref={ref} data-reached="-1">
      <span className="rag-pipeline-track" aria-hidden="true">
        <span className="rag-pipeline-fill" />
        <span className="rag-pipeline-dot" />
      </span>

      <ol className="rag-pipeline-list">
        {ragSteps.steps.map((step, index) => (
          <li className="rag-pipeline-node" key={step.number} style={{ "--i": index } as React.CSSProperties}>
            <div className="rag-pipeline-marker" aria-hidden="true">
              <span />
            </div>
            <div className="rag-step">
              <span className="rag-step-number">{step.number}</span>
              <h3 className="rag-step-name">{step.name}</h3>
              <span className="rag-step-check" aria-hidden="true">
                ✓
              </span>
            </div>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
