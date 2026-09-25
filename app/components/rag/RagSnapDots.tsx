"use client";

import { useEffect, useState } from "react";

/*
 * Pagination dots for a horizontal scroll-snap row (found by id).
 * The active dot follows the scroll position; clicking a dot scrolls
 * to that item. Hidden on desktop via CSS (.rag-dots).
 */
export default function RagSnapDots({
  targetId,
  count,
  label,
  onChange,
}: {
  targetId: string;
  count: number;
  label: string;
  onChange?: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const track = document.getElementById(targetId);
    if (!track) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const items = Array.from(track.children) as HTMLElement[];
      if (items.length < 2) return;
      const step = items[1].offsetLeft - items[0].offsetLeft;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const index = atEnd ? items.length - 1 : Math.round(track.scrollLeft / step);
      setCurrent(index);
      onChange?.(index);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    frame = requestAnimationFrame(sync);
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [targetId, onChange]);

  const goTo = (index: number) => {
    const track = document.getElementById(targetId);
    const items = track ? (Array.from(track.children) as HTMLElement[]) : [];
    if (!track || !items[index]) return;
    track.scrollTo({ left: items[index].offsetLeft - items[0].offsetLeft, behavior: "smooth" });
  };

  return (
    <div className="rag-dots" role="group" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className={index === current ? "is-active" : undefined}
          aria-label={`Go to item ${index + 1} of ${count}`}
          aria-current={index === current ? "true" : undefined}
          onClick={() => goTo(index)}
        />
      ))}
    </div>
  );
}
