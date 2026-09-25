"use client";

import { useCallback, useRef, useState } from "react";
import { ragIndustries, ragLinks } from "@/app/data/rag-page";
import RagIcon from "./RagIcon";
import RagSnapDots from "./RagSnapDots";

/*
 * Industry cards in a horizontal slider. Every card shows what the
 * assistant answers plus a sample Q&A with its source chip. The active
 * card (hover / focus / tap, or the snapped card on touch screens) gets
 * a glow and replays its chat.
 */
export default function RagIndustryCards() {
  const { items, cta } = ragIndustries;
  const [active, setActive] = useState(-1);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Touch screens have no hover: highlight whichever card is snapped into view.
  const onSnap = useCallback((index: number) => {
    if (window.matchMedia("(hover: none)").matches) setActive(index);
  }, []);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".rag-icard");
    if (!track || !card) return;
    track.scrollBy({ left: direction * (card.offsetWidth + 20), behavior: "smooth" });
  };

  return (
    <div className="rag-islider">
      <div className="rag-itrack" id="rag-itrack" ref={trackRef}>
        {items.map((item, index) => (
          <article
            key={item.id}
            className={`rag-icard ${index === active ? "is-active" : ""}`}
            style={{ "--accent": item.accent } as React.CSSProperties}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            aria-labelledby={`rag-icard-${item.id}`}
          >
            <header className="rag-icard-head">
              <span className="rag-icard-icon">
                <RagIcon name={item.icon} size={22} />
              </span>
              <h3 id={`rag-icard-${item.id}`}>{item.name}</h3>
              <a className="rag-icard-arrow" href={ragLinks.contact} aria-label={`${cta} ${item.name}`}>
                <RagIcon name="arrow" size={18} />
              </a>
            </header>

            <p className="rag-icard-desc">{item.description}</p>

            <ul className="rag-icard-list">
              {item.answers.map((answer) => (
                <li key={answer}>
                  <RagIcon name="check" size={13} />
                  {answer}
                </li>
              ))}
            </ul>

            <div className="rag-icard-chat">
              <p className="rag-icard-q">{item.question}</p>
              <div className="rag-icard-a">
                <p>{item.answer}</p>
                <span className="rag-icard-source">
                  <RagIcon name="check" size={11} />
                  {item.docs[item.match]}
                </span>
              </div>
            </div>

            <a className="rag-icard-cta" href={ragLinks.contact}>
              {cta} {item.name}
              <span aria-hidden="true">›</span>
            </a>
          </article>
        ))}
      </div>

      <div className="rag-islider-controls">
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous industries">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="More industries">
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <RagSnapDots targetId="rag-itrack" count={items.length} label="Industries" onChange={onSnap} />
    </div>
  );
}
