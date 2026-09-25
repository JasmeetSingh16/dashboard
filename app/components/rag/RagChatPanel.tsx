"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ragDemo, ragLinks } from "@/app/data/rag-page";
import { getKnowledgeAssistant, type AssistantReply, type RetrievalInfo, type SourceRef } from "@/app/lib/rag";
import { detectLanguage } from "@/app/lib/rag/language";
import RagIcon from "./RagIcon";

/* ------------------------------------------------------------------ */
/* JASEIR RAG ASSISTANT — live chat panel                              */
/* ------------------------------------------------------------------ */
/*
 * Everything shown about documents, passages, sources and answers comes
 * from the live backend:
 *   GET  /api/rag/sources/   documents + passage counts (source cards)
 *   POST /api/rag/chat/      streaming answer (retrieval → deltas → done)
 *   POST /api/rag/feedback/  👍/👎
 */

type KnowledgeSource = { path: string; title: string; label: string; passages: number };

type BotMeta = { seconds: number | null; language: string | null };
type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; reply: AssistantReply; meta: BotMeta };

type Phase = "idle" | "searching" | "found" | "writing" | "streaming";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const SOURCE_ICONS: Record<string, string> = {
  faq: "faq",
  pricing: "pricing",
  privacy: "policy",
  process: "target",
  services: "website",
};
// Display order of the source cards; documents not listed go last.
const SOURCE_ORDER = ["services", "pricing", "process", "faq", "privacy"];
const sourceRank = (path: string) => {
  const i = SOURCE_ORDER.indexOf(path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "");
  return i < 0 ? SOURCE_ORDER.length : i;
};

const sourceIcon = (path: string) => SOURCE_ICONS[path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? ""] ?? "doc";

/* ---------------------------- Answer card --------------------------- */

function Passage({ source }: { source: SourceRef }) {
  const passage = source.passage ?? source.highlight;
  const at = passage.indexOf(source.highlight);
  return (
    <blockquote className="rcp-passage">
      <cite>
        {source.document ?? source.source} › {source.title}
      </cite>
      {at >= 0 ? (
        <p>
          {passage.slice(0, at)}
          <mark>{source.highlight}</mark>
          {passage.slice(at + source.highlight.length)}
        </p>
      ) : (
        <p>
          <mark>{source.highlight}</mark>
        </p>
      )}
    </blockquote>
  );
}

function AnswerCard({
  reply,
  meta,
  rating,
  onRate,
}: {
  reply: Extract<AssistantReply, { type: "answer" }>;
  meta: BotMeta;
  rating: 1 | -1 | undefined;
  onRate: (rating: 1 | -1) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const openSource = reply.sources.find((s) => s.id === open);
  const k = reply.sources.length;

  return (
    <div className="rcp-bot-card">
      <p className="rcp-text">{reply.text}</p>

      {k > 0 && (
        <div className="rcp-sources">
          <span className="rcp-sources-label">{ragDemo.sourcesLabel}</span>
          {reply.sources.map((source) => (
            <button
              type="button"
              key={source.id}
              className={`rcp-chip ${open === source.id ? "is-open" : ""}`}
              aria-expanded={open === source.id}
              onClick={() => setOpen(open === source.id ? null : source.id)}
            >
              <RagIcon name={sourceIcon(source.path ?? "")} size={13} />
              <span>
                {source.document ?? source.source} › {source.title}
              </span>
            </button>
          ))}
        </div>
      )}
      {openSource && <Passage source={openSource} />}

      <div className="rcp-footer">
        <span>
          {fill(ragDemo.groundedIn, {
            k,
            s: k === 1 ? "" : "s",
            seconds: meta.seconds === null ? "—" : meta.seconds.toFixed(1),
          })}
        </span>
        {meta.language && <span className="rcp-lang">{fill(ragDemo.repliedIn, { language: meta.language })}</span>}
        {reply.messageId && (
          <span className="rcp-rate" role="group" aria-label="Was this answer helpful?">
            <button
              type="button"
              aria-label="Helpful"
              aria-pressed={rating === 1}
              className={rating === 1 ? "is-on" : undefined}
              onClick={() => onRate(1)}
            >
              <RagIcon name="thumbUp" size={14} />
            </button>
            <button
              type="button"
              aria-label="Not helpful"
              aria-pressed={rating === -1}
              className={rating === -1 ? "is-on" : undefined}
              onClick={() => onRate(-1)}
            >
              <RagIcon name="thumbDown" size={14} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

function HandoffCard({ reply }: { reply: Extract<AssistantReply, { type: "fallback" }> }) {
  const title =
    reply.reason === "rate-limited" ? ragDemo.limitTitle : reply.reason === "error" ? ragDemo.errorTitle : ragDemo.handoffTitle;
  const body = reply.reason === "no-answer" && reply.text === ragDemo.replies.noAnswer ? ragDemo.handoffBody : reply.text;

  return (
    <div className="rcp-handoff">
      <span className="rcp-handoff-icon" aria-hidden="true">
        <RagIcon name="user" size={18} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
        <div className="rcp-handoff-actions">
          <a className="rcp-btn rcp-btn-amber" href={reply.handoffUrl}>
            <RagIcon name="users" size={15} />
            {reply.handoffLabel ?? ragDemo.handoffLabel}
          </a>
          {reply.whatsappUrl && (
            <a className="rcp-btn rcp-btn-wa" href={reply.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <RagIcon name="whatsapp" size={15} />
              {ragDemo.replies.whatsappLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Panel ------------------------------- */

export default function RagChatPanel() {
  const [session, setSession] = useState(0);
  // A new session = a new assistant (fresh conversation id + history).
  const assistant = useMemo(() => getKnowledgeAssistant(ragLinks.contact), [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const [sources, setSources] = useState<KnowledgeSource[] | null>(null);
  const [sourcesFailed, setSourcesFailed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [retrieval, setRetrieval] = useState<RetrievalInfo | null>(null);
  const [streamText, setStreamText] = useState("");
  const [citedPaths, setCitedPaths] = useState<string[]>([]);
  const [userAsked, setUserAsked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [placeholder, setPlaceholder] = useState(0);
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({});

  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextId = useRef(0);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelAutoplayRef = useRef<() => void>(() => {});

  /* Real documents + passage counts. */
  useEffect(() => {
    let alive = true;
    fetch("/api/rag/sources/")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { sources: KnowledgeSource[] }) =>
        alive && setSources([...json.sources].sort((a, b) => sourceRank(a.path) - sourceRank(b.path)))
      )
      .catch(() => alive && setSourcesFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const totalPassages = sources?.reduce((sum, s) => sum + s.passages, 0) ?? 0;

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [messages, phase, streamText, retrieval]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* Full screen: lock page scroll, Esc closes. */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.documentElement.classList.add("rcp-locked");
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("rcp-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  /* Rotating example placeholders (static with reduced motion). */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setPlaceholder((i) => (i + 1) % ragDemo.placeholders.length), 3500);
    return () => window.clearInterval(timer);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      // One question at a time: the input is disabled while busy, and this
      // guard means a second quick submit is refused, never silently lost.
      if (!text || busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const started = performance.now();

      setMessages((current) => [...current, { id: nextId.current++, role: "user", text }]);
      setInput("");
      setPhase("searching");
      setRetrieval(null);
      setStreamText("");
      setCitedPaths([]);

      let reply: AssistantReply;
      try {
        reply = await assistant.ask(text, {
          signal: controller.signal,
          onRetrieval: (info) => {
            setRetrieval(info);
            setPhase("found");
            window.setTimeout(() => setPhase((p) => (p === "found" ? "writing" : p)), 300);
          },
          onDelta: (partial) => {
            setStreamText(partial);
            setPhase("streaming");
          },
        });
      } catch {
        busyRef.current = false;
        setBusy(false);
        setPhase("idle");
        return false; // aborted (chat cleared)
      }

      const seconds = (performance.now() - started) / 1000;
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "bot",
          reply,
          meta: { seconds, language: reply.type === "answer" ? detectLanguage(reply.text) : null },
        },
      ]);
      setCitedPaths(reply.type === "answer" ? [...new Set(reply.sources.flatMap((s) => (s.path ? [s.path] : [])))] : []);
      setStreamText("");
      setRetrieval(null);
      setPhase("idle");
      busyRef.current = false;
      setBusy(false);
      return true;
    },
    [assistant]
  );

  /* On load: type the preset question and ask it (served from the cache). */
  useEffect(() => {
    const question = ragDemo.autoplayQuestion;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    let cancelled = false;
    let typing = false;
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    cancelAutoplayRef.current = () => {
      if (cancelled) return;
      cancelled = true;
      timers.forEach(window.clearTimeout);
      if (typing) setInput("");
    };

    if (reduced) later(() => ask(question), 400);
    else {
      let typed = 0;
      const typeNext = () => {
        typing = true;
        typed += 1;
        setInput(question.slice(0, typed));
        if (typed < question.length) later(typeNext, 45);
        else
          later(() => {
            typing = false;
            ask(question);
          }, 400);
      };
      later(typeNext, 1000);
    }
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [ask]);

  const userAsk = async (question: string) => {
    cancelAutoplayRef.current();
    if (await ask(question)) setUserAsked(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    userAsk(input);
  };

  const clearChat = () => {
    cancelAutoplayRef.current();
    abortRef.current?.abort();
    busyRef.current = false;
    setBusy(false);
    setMessages([]);
    setInput("");
    setPhase("idle");
    setRetrieval(null);
    setStreamText("");
    setCitedPaths([]);
    setUserAsked(false);
    setRatings({});
    setSession((s) => s + 1);
  };

  const rate = async (messageId: string, value: 1 | -1) => {
    const previous = ratings[messageId];
    setRatings((r) => ({ ...r, [messageId]: value }));
    const ok = await fetch("/api/rag/feedback/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, rating: value }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) setRatings((r) => ({ ...r, [messageId]: previous as 1 | -1 }));
  };

  // Chips: starters until the visitor asks something; then 2 unasked follow-ups.
  const asked = new Set(messages.flatMap((m) => (m.role === "user" ? [m.text.toLowerCase()] : [])));
  const chips = userAsked
    ? ragDemo.followUps.filter((q) => !asked.has(q.toLowerCase())).slice(0, 2).map((text) => ({ icon: "sparkle", text }))
    : ragDemo.suggestions;

  const searchingPaths = busy && retrieval ? retrieval.paths : [];
  const thinking = busy && phase !== "streaming";

  return (
    <div className={`rcp ${expanded ? "is-expanded" : ""}`} id="live-demo">
      {expanded && <div className="rcp-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}
      <div className="rcp-panel" role={expanded ? "dialog" : undefined} aria-label={expanded ? ragDemo.title : undefined}>
        {/* Header */}
        <header className="rcp-head">
          <span className="rcp-bot-icon" aria-hidden="true">
            <RagIcon name="sparkle" size={20} />
          </span>
          <div className="rcp-head-text">
            <strong>{ragDemo.title}</strong>
            <small>
              <i aria-hidden="true" /> {ragDemo.status}
            </small>
          </div>
          <div className="rcp-head-actions">
            <button type="button" onClick={clearChat} aria-label={ragDemo.clearLabel} title={ragDemo.clearLabel}>
              <RagIcon name="refresh" size={17} />
            </button>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? ragDemo.collapseLabel : ragDemo.expandLabel}
              title={expanded ? ragDemo.collapseLabel : ragDemo.expandLabel}
            >
              <RagIcon name={expanded ? "collapse" : "expand"} size={17} />
            </button>
          </div>
        </header>

        {/* Source cards: the real knowledge documents */}
        {!sourcesFailed && (
          <div className="rcp-docs" aria-label="Knowledge sources">
            {sources === null
              ? [0, 1, 2, 3].map((i) => <div key={i} className="rcp-doc is-loading" aria-hidden="true" />)
              : sources.map((source) => {
                  const cited = citedPaths.includes(source.path);
                  const searching = searchingPaths.includes(source.path);
                  return (
                    <div
                      key={source.path}
                      className={`rcp-doc ${cited ? "is-cited" : ""} ${searching ? "is-searching" : ""}`}
                      title={source.title}
                    >
                      <span className="rcp-doc-icon">
                        <RagIcon name={sourceIcon(source.path)} size={18} />
                      </span>
                      <span className="rcp-doc-text">
                        <strong>{source.label}</strong>
                        <small>
                          {source.passages} passage{source.passages === 1 ? "" : "s"}
                        </small>
                      </span>
                      {cited && (
                        <span className="rcp-doc-check" aria-label="Cited in the latest answer">
                          <RagIcon name="check" size={11} />
                        </span>
                      )}
                    </div>
                  );
                })}
          </div>
        )}

        {/* Conversation */}
        <div className="rcp-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
          <div className="rcp-row rcp-row-bot">
            <span className="rcp-avatar rcp-avatar-bot" aria-hidden="true">
              <RagIcon name="sparkle" size={16} />
            </span>
            <div className="rcp-bot-card">
              <p className="rcp-text">{ragDemo.greeting}</p>
            </div>
          </div>

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="rcp-row rcp-row-user">
                <p className="rcp-user-bubble">{message.text}</p>
                <span className="rcp-avatar rcp-avatar-user" aria-hidden="true">
                  <RagIcon name="user" size={16} />
                </span>
              </div>
            ) : (
              <div key={message.id} className="rcp-row rcp-row-bot">
                <span className="rcp-avatar rcp-avatar-bot" aria-hidden="true">
                  <RagIcon name="sparkle" size={16} />
                </span>
                {message.reply.type === "answer" ? (
                  <AnswerCard
                    reply={message.reply}
                    meta={message.meta}
                    rating={message.reply.messageId ? ratings[message.reply.messageId] : undefined}
                    onRate={(value) => message.reply.messageId && rate(message.reply.messageId, value)}
                  />
                ) : (
                  <HandoffCard reply={message.reply} />
                )}
              </div>
            )
          )}

          {/* The signature RAG moment: visible retrieval steps */}
          {thinking && (
            <div className="rcp-row rcp-row-bot">
              <span className="rcp-avatar rcp-avatar-bot is-pulsing" aria-hidden="true">
                <RagIcon name="sparkle" size={16} />
              </span>
              <ol className="rcp-steps">
                <li className={retrieval ? "is-done" : "is-active"}>
                  <span className="rcp-step-dot" aria-hidden="true" />
                  {totalPassages
                    ? fill(ragDemo.thinking.searching, { n: totalPassages })
                    : ragDemo.thinking.searchingUnknown}
                </li>
                {retrieval && (
                  <li className={phase === "found" ? "is-active" : "is-done"}>
                    <span className="rcp-step-dot" aria-hidden="true" />
                    {fill(ragDemo.thinking.found, { k: retrieval.count, docs: listNames(retrieval.documents) })}
                  </li>
                )}
                {retrieval && phase === "writing" && (
                  <li className="is-active">
                    <span className="rcp-step-dot" aria-hidden="true" />
                    {ragDemo.thinking.writing}
                  </li>
                )}
              </ol>
            </div>
          )}

          {busy && phase === "streaming" && (
            <div className="rcp-row rcp-row-bot">
              <span className="rcp-avatar rcp-avatar-bot" aria-hidden="true">
                <RagIcon name="sparkle" size={16} />
              </span>
              <div className="rcp-bot-card">
                <p className="rcp-text">
                  {streamText}
                  <span className="rcp-caret" aria-hidden="true" />
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {chips.length > 0 && (
          <div className="rcp-chips">
            {chips.map((chip) => (
              <button type="button" key={chip.text} onClick={() => userAsk(chip.text)} disabled={busy}>
                <RagIcon name={chip.icon} size={15} />
                {chip.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form className="rcp-form" onSubmit={onSubmit}>
          <label htmlFor="rcp-input" className="rag-sr-only">
            Ask the Jaseir RAG Assistant a question
          </label>
          <input
            id="rcp-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              cancelAutoplayRef.current();
              setInput(e.target.value);
            }}
            onFocus={() => cancelAutoplayRef.current()}
            placeholder={ragDemo.placeholders[placeholder]}
            autoComplete="off"
            maxLength={300}
            disabled={busy}
            aria-busy={busy}
          />
          <button type="submit" aria-label="Send question" disabled={busy || !input.trim()}>
            <RagIcon name="send" size={18} />
          </button>
        </form>

        <p className="rcp-disclaimer">
          {ragDemo.disclaimer} {ragDemo.disclaimerFallback}
        </p>
      </div>
    </div>
  );
}
