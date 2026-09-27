"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ragDemo, ragLinks } from "@/app/data/rag-page";
import {
  demoDisclaimer,
  demoPageCopy,
  demoSampleLabel,
  isIndustryDemoId,
  presetQuestions,
  ragDemos,
  type DemoId,
} from "@/app/data/rag-demos";
import { WHATSAPP_URL } from "@/app/data/site-config";
import { getKnowledgeAssistant, type AssistantReply, type RetrievalInfo, type SourceRef } from "@/app/lib/rag";
import { detectLanguage } from "@/app/lib/rag/language";
import LeadButton from "../leads/LeadButton";
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
 * Each call carries the panel's tenant: "jaseir" on the main RAG page, or
 * one industry on its demo page (/rag-knowledge-assistant/demo/<id>/).
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

const SOURCE_ICON_KEYWORDS: [RegExp, string][] = [
  [/billing|price|pricing|insurance|payment/, "pricing"],
  [/faq/, "faq"],
  [/privacy|policy|returns/, "policy"],
  [/support|site-visits|appointments/, "users"],
  [/shipping|products/, "cart"],
  [/troubleshoot/, "search"],
  [/projects/, "building"],
  [/getting-started|services/, "website"],
];
const sourceIcon = (path: string) => {
  const name = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  return SOURCE_ICONS[name] ?? SOURCE_ICON_KEYWORDS.find(([re]) => re.test(name))?.[1] ?? "doc";
};

/* ---------------------------- Answer card --------------------------- */

function Passage({ source, tag }: { source: SourceRef; tag?: string }) {
  const passage = source.passage ?? source.highlight;
  const at = passage.indexOf(source.highlight);
  return (
    <blockquote className="rcp-passage">
      {tag && <span className="rcp-passage-tag">{tag}</span>}
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
  initialOpen = null,
  onOpenSource,
  passageTag,
  demoCopy = false,
}: {
  reply: Extract<AssistantReply, { type: "answer" }>;
  meta: BotMeta;
  rating: 1 | -1 | undefined;
  onRate: (rating: 1 | -1) => void;
  /** Source id to show expanded straight away (demo pages: the mobile "sheet"). */
  initialOpen?: string | null;
  onOpenSource?: (source: SourceRef) => void;
  passageTag?: string;
  /** Demo pages: "✓ Answered from k sources · 1.9s" pill. */
  demoCopy?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(initialOpen);
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
              onClick={() => {
                setOpen(open === source.id ? null : source.id);
                onOpenSource?.(source);
              }}
            >
              <RagIcon name={sourceIcon(source.path ?? "")} size={13} />
              <span>
                {source.document ?? source.source} › {source.title}
              </span>
            </button>
          ))}
        </div>
      )}
      {openSource && <Passage source={openSource} tag={passageTag} />}

      <div className="rcp-footer">
        {demoCopy ? (
          <span className="rcp-answered">
            <RagIcon name="check" size={12} />
            {fill(demoPageCopy.answeredFrom, {
              k,
              s: k === 1 ? "" : "s",
              seconds: meta.seconds === null ? "—" : meta.seconds.toFixed(1),
            })}
          </span>
        ) : (
          <span>
            {fill(ragDemo.groundedIn, {
              k,
              s: k === 1 ? "" : "s",
              seconds: meta.seconds === null ? "—" : meta.seconds.toFixed(1),
            })}
          </span>
        )}
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

/** Demo pages: "I'd rather not guess" + Talk to a person (lead form) + WhatsApp. */
function DemoHandoffCard({ reply, tenant }: { reply: Extract<AssistantReply, { type: "fallback" }>; tenant: DemoId }) {
  const text = reply.reason === "no-answer" ? demoPageCopy.handoff.message : reply.text;
  return (
    <div className="rcp-handoff rcp-handoff-demo">
      <span className="rcp-handoff-icon" aria-hidden="true">
        <RagIcon name="users" size={18} />
      </span>
      <div>
        <p className="rcp-handoff-msg">{text}</p>
        <div className="rcp-handoff-actions">
          <LeadButton className="rcp-btn rcp-btn-accent" industry={isIndustryDemoId(tenant) ? tenant : "other"}>
            <RagIcon name="user" size={15} />
            {demoPageCopy.handoff.talk}
          </LeadButton>
          <a className="rcp-btn rcp-btn-wa" href={reply.whatsappUrl ?? WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <RagIcon name="whatsapp" size={15} />
            {demoPageCopy.handoff.whatsapp}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Panel ------------------------------- */

type PanelProps = {
  /** Which knowledge base answers — fixed for the lifetime of the panel. */
  tenant?: DemoId;
  /* ---- Optional hooks used by the industry demo pages ---- */
  /** Ask a question from outside (e.g. a floating bubble). A new `id` sends it. */
  request?: { id: number; text: string } | null;
  onBusyChange?: (busy: boolean) => void;
  /** Called with every finished reply. */
  onAnswer?: (reply: AssistantReply) => void;
  /** Called when a source chip is clicked. */
  onSourceOpen?: (source: SourceRef) => void;
  /** Thinking-step wording; `found` may use {where} = "Document › Section". */
  thinking?: { searching: string; found: string; writing: string };
  /** Open the first source under each new answer, with this tag (mobile sheet). */
  sourceSheet?: { tag: string };
};

export default function RagChatPanel({
  tenant = "jaseir",
  request = null,
  onBusyChange,
  onAnswer,
  onSourceOpen,
  thinking: thinkingCopy,
  sourceSheet,
}: PanelProps) {
  const [session, setSession] = useState(0);
  const demo = ragDemos[tenant];
  // Industry demo pages: light panel, demo copy, handoff with the lead form.
  const isDemo = demo.sample;
  // A new session = a new assistant (fresh conversation id + history).
  const assistant = useMemo(() => getKnowledgeAssistant(ragLinks.contact, tenant), [session, tenant]); // eslint-disable-line react-hooks/exhaustive-deps
  // A question to send as soon as the (new) assistant is ready.
  const [pending, setPending] = useState<string | null>(null);

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
  const autoplayDoneRef = useRef(false);
  // Latest callbacks, so `ask` doesn't need to change when the parent re-renders.
  const onAnswerRef = useRef(onAnswer);
  const onBusyRef = useRef(onBusyChange);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
    onBusyRef.current = onBusyChange;
  });
  useEffect(() => onBusyRef.current?.(busy), [busy]);

  /* Real documents + passage counts of the selected tenant. */
  useEffect(() => {
    let alive = true;
    fetch(`/api/rag/sources/?tenant=${tenant}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { sources: KnowledgeSource[] }) =>
        alive &&
        setSources(
          tenant === "jaseir"
            ? [...json.sources].sort((a, b) => sourceRank(a.path) - sourceRank(b.path))
            : json.sources
        )
      )
      .catch(() => alive && setSourcesFailed(true));
    return () => {
      alive = false;
    };
  }, [tenant]);

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
    const timer = window.setInterval(() => setPlaceholder((i) => i + 1), 3500);
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
      onAnswerRef.current?.(reply);
      setStreamText("");
      setRetrieval(null);
      setPhase("idle");
      busyRef.current = false;
      setBusy(false);
      return true;
    },
    [assistant]
  );

  /* On load (main RAG page only): type the preset question and ask it (cached). */
  useEffect(() => {
    if (tenant !== "jaseir" || autoplayDoneRef.current) return;
    const question = ragDemo.autoplayQuestion;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    let cancelled = false;
    let typing = false;
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    cancelAutoplayRef.current = () => {
      autoplayDoneRef.current = true;
      if (cancelled) return;
      cancelled = true;
      timers.forEach(window.clearTimeout);
      if (typing) setInput("");
    };

    const askNow = () => {
      autoplayDoneRef.current = true;
      ask(question);
    };
    if (reduced) later(askNow, 400);
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
            askNow();
          }, 400);
      };
      later(typeNext, 1000);
    }
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [ask, tenant]);

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
    setPending(null);
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

  /* Send a queued question once the new tenant's assistant exists. */
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(async () => {
      setPending(null);
      if (await ask(pending)) setUserAsked(true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pending, ask]);

  /* Demo pages: a question from outside the panel (floating bubbles). */
  useEffect(() => {
    if (!request) return;
    const timer = window.setTimeout(() => {
      cancelAutoplayRef.current();
      setPending(request.text);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [request]);

  /* Demo pages: ?q=<question> from an industry card's "Try it live" link.
     Only the demo's own preset (cached) questions are sent automatically;
     anything else is just placed in the input. */
  useEffect(() => {
    if (tenant === "jaseir") return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("q")?.trim().slice(0, 300);
      if (!q) return;
      url.searchParams.delete("q");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      const preset = presetQuestions(tenant).find((p) => p.toLowerCase() === q.toLowerCase());
      if (preset) setPending(preset);
      else setInput(q);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tenant]);

  const rate = async (messageId: string, value: 1 | -1) => {
    const previous = ratings[messageId];
    setRatings((r) => ({ ...r, [messageId]: value }));
    const ok = await fetch("/api/rag/feedback/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, rating: value, tenant }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) setRatings((r) => ({ ...r, [messageId]: previous as 1 | -1 }));
  };

  // Chips: starters until the visitor asks something; then 2 unasked follow-ups.
  const asked = new Set(messages.flatMap((m) => (m.role === "user" ? [m.text.toLowerCase()] : [])));
  // Demo pages also always offer their handoff question (while unasked).
  const handoffChip =
    demo.handoffQuestion && !asked.has(demo.handoffQuestion.toLowerCase())
      ? [{ icon: "chat", text: demo.handoffQuestion }]
      : [];
  const chips = userAsked
    ? [
        ...[...demo.followUps, ...demo.starters.map((s) => s.text)]
          .filter((q) => !asked.has(q.toLowerCase()))
          .slice(0, 2)
          .map((text) => ({ icon: "sparkle", text })),
        ...handoffChip,
      ]
    : [...demo.starters, ...handoffChip];

  const placeholders =
    tenant === "jaseir"
      ? ragDemo.placeholders
      : ["Ask a question…", ...demo.starters.map((s) => `e.g. ${s.text}`)];

  const searchingPaths = busy && retrieval ? retrieval.paths : [];
  const thinking = busy && phase !== "streaming";

  return (
    <div className={`rcp ${isDemo ? "rcp-light" : ""} ${expanded ? "is-expanded" : ""}`} id="live-demo">
      {expanded && <div className="rcp-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}
      <div className="rcp-panel" role={expanded ? "dialog" : undefined} aria-label={expanded ? demo.title : undefined}>
        {/* Header */}
        <header className="rcp-head">
          <span className="rcp-bot-icon" aria-hidden="true">
            <RagIcon name="sparkle" size={20} />
          </span>
          <div className="rcp-head-text">
            <strong>{demo.title}</strong>
            <small>
              <i aria-hidden="true" /> {demo.status}
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
                          {isDemo
                            ? fill(demoPageCopy.topics, { n: source.passages, s: source.passages === 1 ? "" : "s" })
                            : `${source.passages} passage${source.passages === 1 ? "" : "s"}`}
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
              <p className="rcp-text">{demo.greeting}</p>
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
                    initialOpen={sourceSheet ? message.reply.sources[0]?.id ?? null : null}
                    onOpenSource={onSourceOpen}
                    passageTag={sourceSheet?.tag}
                    demoCopy={isDemo}
                    rating={message.reply.messageId ? ratings[message.reply.messageId] : undefined}
                    onRate={(value) => message.reply.messageId && rate(message.reply.messageId, value)}
                  />
                ) : isDemo ? (
                  <DemoHandoffCard reply={message.reply} tenant={tenant} />
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
                    ? fill(thinkingCopy?.searching ?? ragDemo.thinking.searching, { n: totalPassages })
                    : ragDemo.thinking.searchingUnknown}
                </li>
                {retrieval && (
                  <li className={phase === "found" ? "is-active" : "is-done"}>
                    <span className="rcp-step-dot" aria-hidden="true" />
                    {fill(thinkingCopy?.found ?? ragDemo.thinking.found, {
                      k: retrieval.count,
                      docs: listNames(retrieval.documents),
                      where: retrieval.top ? `${retrieval.top.document} › ${retrieval.top.section}` : listNames(retrieval.documents),
                    })}
                  </li>
                )}
                {retrieval && phase === "writing" && (
                  <li className="is-active">
                    <span className="rcp-step-dot" aria-hidden="true" />
                    {thinkingCopy?.writing ?? ragDemo.thinking.writing}
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
            Ask the {demo.title} a question
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
            placeholder={placeholders[placeholder % placeholders.length]}
            autoComplete="off"
            maxLength={300}
            disabled={busy}
            aria-busy={busy}
          />
          <button type="submit" aria-label="Send question" disabled={busy || !input.trim()}>
            <RagIcon name="send" size={18} />
          </button>
        </form>

        {isDemo ? (
          <p className="rcp-disclaimer">
            <span className="rcp-sample">{demoSampleLabel}</span>{" "}
            <span className="rcp-disclaimer-text">{demoDisclaimer}</span>
          </p>
        ) : (
          <p className="rcp-disclaimer">
            {ragDemo.disclaimer} {ragDemo.disclaimerFallback}
          </p>
        )}
      </div>
    </div>
  );
}
