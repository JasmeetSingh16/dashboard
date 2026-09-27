"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { demoPageCopy, type IndustryDemoId } from "@/app/data/rag-demos";
import type { AssistantReply, SourceRef } from "@/app/lib/rag";
import RagChatPanel from "./RagChatPanel";

/* ------------------------------------------------------------------ */
/* Industry demo page: visual panel (photo ⇄ source viewer) + chat     */
/* ------------------------------------------------------------------ */
/*
 * - Floating question bubbles on the photo send their question to the chat.
 * - The panel always shows the photo by default. When an answer has a
 *   source, a dot pulses on "Show source"; the "Source document" card (the
 *   passage the API returned, used sentence highlighted) opens only when
 *   the visitor clicks "Show source" or a source chip in the chat.
 * Layout (rag.css): photo left + chat right from 1200px; below that the chat
 * comes first, the source opens as a sheet under the answer, and the photo
 * shows at most 3 bubbles (none below 768px).
 *
 * Recording mode (?record=1): only the chat, centred and larger (for screen
 * recordings). Detected on the client so the pages stay static.
 */

const noSubscribe = () => () => {};
const readRecordMode = () => new URLSearchParams(window.location.search).get("record") === "1";

type Props = {
  tenant: IndustryDemoId;
  image: { src: string | null; alt: string };
  bubbles: string[];
  /** Server-rendered label, heading and description (above the visual). */
  header: ReactNode;
  /** Server-rendered checklist (below the visual). */
  footer: ReactNode;
};

function SourceCard({ source }: { source: SourceRef }) {
  const passage = source.passage ?? source.highlight;
  const at = passage.indexOf(source.highlight);
  return (
    <div className="rdp-source">
      <div className="rdp-source-head">
        <span className="rdp-source-kicker">{demoPageCopy.sourceTitle}</span>
        <span className="rdp-source-tag">{demoPageCopy.usedTag}</span>
      </div>
      <h3>{source.document ?? source.source}</h3>
      <p className="rdp-source-section">{source.title}</p>
      <p className="rdp-source-text">
        {at >= 0 ? (
          <>
            {passage.slice(0, at)}
            <mark>{source.highlight}</mark>
            {passage.slice(at + source.highlight.length)}
          </>
        ) : (
          <mark>{source.highlight}</mark>
        )}
      </p>
    </div>
  );
}

export default function RagDemoExperience({ tenant, image, bubbles, header, footer }: Props) {
  const record = useSyncExternalStore(noSubscribe, readRecordMode, () => false);
  const [view, setView] = useState<"photo" | "source">("photo");
  const [source, setSource] = useState<SourceRef | null>(null);
  const [request, setRequest] = useState<{ id: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  /** A new answer's source hasn't been opened yet → pulse on "Show source". */
  const [unseen, setUnseen] = useState(false);

  const showView = (next: "photo" | "source") => {
    setView(next);
    if (next === "source") setUnseen(false);
  };

  const onAnswer = useCallback((reply: AssistantReply) => {
    if (reply.type !== "answer" || reply.sources.length === 0) return;
    setSource(reply.sources[0]);
    setView("photo");
    setUnseen(true);
  }, []);

  const onSourceOpen = useCallback((next: SourceRef) => {
    setSource(next);
    setView("source");
    setUnseen(false);
  }, []);

  const askBubble = (text: string) => {
    if (busy) return;
    setRequest((current) => ({ id: (current?.id ?? 0) + 1, text }));
  };

  return (
    <div className={`rdp-grid ${record ? "is-record" : ""}`}>
      <div className="rdp-head">{header}</div>

      <div className="rdp-side">
        <div className={`rdp-visual is-${view}`}>
          {/* Photo layer (or accent gradient) + floating question bubbles */}
          <div className="rdp-photo" aria-hidden={view !== "photo"}>
            {image.src ? (
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 1000px) 100vw, 560px" priority />
            ) : (
              <div className="rdp-placeholder" role="img" aria-label={image.alt} />
            )}
            <span className="rdp-photo-overlay" aria-hidden="true" />
          </div>

          <div className="rdp-bubbles" role="group" aria-label={demoPageCopy.bubblesLabel}>
            {bubbles.map((text, index) => (
              <button
                type="button"
                key={text}
                className="rdp-bubble"
                style={{ "--i": index } as React.CSSProperties}
                onClick={() => askBubble(text)}
                disabled={busy}
                tabIndex={view === "photo" ? 0 : -1}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Source viewer layer */}
          <div className="rdp-source-layer" aria-hidden={view !== "source"} aria-live="polite">
            {source && <SourceCard source={source} />}
          </div>

          {source && (
            <div className="rdp-visual-toggle" role="group" aria-label="Panel view">
              <button type="button" aria-pressed={view === "photo"} onClick={() => showView("photo")}>
                {demoPageCopy.showPhoto}
              </button>
              <button type="button" aria-pressed={view === "source"} onClick={() => showView("source")}>
                {demoPageCopy.showSource}
                {unseen && <span className="rdp-new-dot" aria-hidden="true" />}
              </button>
            </div>
          )}
        </div>

        {footer}
      </div>

      <div className="rdp-chat">
        <RagChatPanel
          tenant={tenant}
          request={request}
          onBusyChange={setBusy}
          onAnswer={onAnswer}
          onSourceOpen={onSourceOpen}
          thinking={demoPageCopy.thinking}
          sourceSheet={{ tag: demoPageCopy.usedTag }}
        />
      </div>
    </div>
  );
}
