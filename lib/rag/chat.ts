import "server-only";
import { ragDemo } from "@/app/data/rag-page";
import { BOOKING_URL, WHATSAPP_URL } from "@/app/data/site-config";
import { citedPassages, cleanAnswer, docLabel, hasHandoffMarker } from "@/app/lib/rag/format";
import type { AssistantReply, SourceRef } from "@/app/lib/rag/types";
import { getCachedReply, isCacheable, setCachedReply } from "./cache";
import { LIMITS, LLM, RAG, SOURCE_CARD_BY_PATH } from "./config";
import { tenantId } from "./db";
import { ensureConversation, logExchange } from "./log";
import { answerMessages, rewriteMessages, type HistoryMessage } from "./prompt";
import { llm, type LLMUsage } from "./providers/llm";
import { checkRateLimit, visitorKey } from "./rate-limit";
import { retrieve, type RetrievedChunk } from "./retrieve";

/* ------------------------------------------------------------------ */
/* CHAT ORCHESTRATOR                                                   */
/* ------------------------------------------------------------------ */
/*
 * One message:
 *   cache hit? → reply instantly (no LLM, no rate-limit slot)
 *   rate limit  → friendly message + "Book a call"
 *   rewrite     → standalone question (gpt-oss-20b), only if there's history
 *   retrieve    → hybrid search; below MIN_CONFIDENCE → handoff, NO LLM call
 *   answer      → gpt-oss-120b streamed; on any Groq failure → Gemini;
 *                 both fail → handoff
 * Every exchange is logged to `messages` (best effort).
 */

export type ChatInput = { question: string; history: HistoryMessage[]; conversationId?: string };

export type ChatEvent =
  | { type: "start"; conversationId: string | null }
  // Sent after retrieval, before any answer text — powers the "thinking" steps.
  | { type: "retrieval"; count: number; documents: string[]; paths: string[] }
  | { type: "delta"; text: string }
  | { type: "done"; reply: AssistantReply };

export type ChatContext = {
  ip: string;
  signal?: AbortSignal;
  /** Internal use only (scripts/warm-cache.ts). Never set from the API route. */
  skipRateLimit?: boolean;
};

const handoff = (
  text: string,
  reason: "no-answer" | "rate-limited" | "error",
  handoffLabel?: string
): AssistantReply => ({
  type: "fallback",
  text,
  reason,
  handoffUrl: BOOKING_URL,
  handoffLabel,
  whatsappUrl: WHATSAPP_URL,
});

/** Chunk text as readable prose: no heading lines, bullets or emphasis marks. */
function plainPassage(content: string): string {
  return content
    .replace(/^#+\s.*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/[*_`]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const words = (text: string) =>
  new Set(text.toLowerCase().split(/[^\p{L}\p{N}$]+/u).filter((w) => w.length > 2));

/** The passage sentence that shares the most words with the answer. */
function bestSentence(passage: string, reference: string): string {
  const target = words(reference);
  const sentences = passage.match(/[^.!?\n]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [passage];
  let best = sentences[0] ?? "";
  let bestScore = -1;
  for (const sentence of sentences) {
    const score = [...words(sentence)].filter((w) => target.has(w)).length;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return best;
}

function toSourceRef(chunk: RetrievedChunk, answer: string): SourceRef {
  const passage = plainPassage(chunk.content).slice(0, 900);
  return {
    id: chunk.id,
    title: chunk.sectionHeading ?? chunk.title,
    source: chunk.title,
    sourceType: SOURCE_CARD_BY_PATH[chunk.path] ?? "website",
    highlight: bestSentence(passage, answer),
    path: chunk.path,
    document: docLabel(chunk.path),
    passage,
  };
}

export async function* runChat(input: ChatInput, context: ChatContext): AsyncGenerator<ChatEvent> {
  const started = performance.now();
  const question = input.question.trim().slice(0, LIMITS.maxQuestionChars);
  const history = input.history.slice(-LLM.historyMessages);
  const tenant = await tenantId();
  const visitor = visitorKey(context.ip);
  const conversationId = await ensureConversation(tenant, visitor, input.conversationId);
  yield { type: "start", conversationId };

  const usage: LLMUsage = { promptTokens: 0, completionTokens: 0 };
  const addUsage = (u: LLMUsage) => {
    usage.promptTokens += u.promptTokens;
    usage.completionTokens += u.completionTokens;
  };
  const finish = async (reply: AssistantReply, extra: { model: string; rewritten?: string | null; usedChunkIds?: string[] }) => {
    const messageId = await logExchange({
      tenant,
      conversationId,
      question,
      rewrittenQuestion: extra.rewritten ?? null,
      answer: reply.text,
      usedChunkIds: extra.usedChunkIds ?? [],
      model: extra.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      latencyMs: Math.round(performance.now() - started),
    });
    return { type: "done", reply: messageId ? { ...reply, messageId } : reply } as const;
  };

  // 1) Cached preset questions.
  const cacheable = isCacheable(question, history.length > 0);
  if (cacheable) {
    const cached = await getCachedReply(question);
    if (cached) {
      yield await finish(cached, { model: "cache", usedChunkIds: cached.type === "answer" ? cached.sources.map((s) => s.id) : [] });
      return;
    }
  }

  // 2) Rate limit (fails open if Redis itself is down, so the demo keeps working).
  try {
    const limit = context.skipRateLimit ? { allowed: true as const } : await checkRateLimit(visitor);
    if (!limit.allowed) {
      const text = limit.window === "hour" ? ragDemo.replies.rateLimitedHour : ragDemo.replies.rateLimitedDay;
      yield await finish(handoff(text, "rate-limited", ragDemo.replies.bookLabel), { model: "rate-limited" });
      return;
    }
  } catch (error) {
    console.warn("[rag] rate limit check failed, allowing request:", error);
  }

  // 3) Rewrite follow-ups into a standalone question (skipped without history).
  let searchQuestion = question;
  let rewritten: string | null = null;
  if (history.length > 0) {
    try {
      const { text, usage: rewriteUsage } = await llm(LLM.rewrite.provider).complete(
        {
          model: LLM.rewrite.model,
          messages: rewriteMessages(question, history),
          maxOutputTokens: LLM.rewrite.maxOutputTokens,
          temperature: LLM.rewrite.temperature,
          reasoningEffort: LLM.rewrite.reasoningEffort,
        },
        context.signal
      );
      addUsage(rewriteUsage);
      const candidate = text.replace(/^["'“]|["'”]$/g, "").trim();
      if (candidate && candidate.length <= 400) {
        searchQuestion = candidate;
        rewritten = candidate;
      }
    } catch (error) {
      console.warn("[rag] rewrite failed, using the original question:", error instanceof Error ? error.message : error);
    }
  }

  // 4) Retrieve. Below the threshold: hand off without calling the LLM.
  let chunks: RetrievedChunk[];
  let confidence = 0;
  try {
    const result = await retrieve(searchQuestion);
    if (result.chunks.length === 0 || result.confidence < RAG.minConfidence) {
      yield await finish(handoff(ragDemo.replies.noAnswer, "no-answer"), {
        model: "handoff:low-confidence",
        rewritten,
        usedChunkIds: result.chunks.map((c) => c.id),
      });
      return;
    }
    chunks = result.chunks;
    confidence = result.confidence;
  } catch (error) {
    console.error("[rag] retrieval failed:", error);
    yield await finish(handoff(ragDemo.replies.error, "error"), { model: "error:retrieval", rewritten });
    return;
  }

  const paths = [...new Set(chunks.map((c) => c.path))];
  yield { type: "retrieval", count: chunks.length, documents: paths.map(docLabel), paths };

  // 5) Answer: Groq first, Gemini if Groq fails before producing any text.
  const messages = answerMessages(searchQuestion, chunks);
  let raw = "";
  let model = "";
  // The fallback gets one retry: as the last resort, a brief pause beats
  // handing off on a momentary 503 "high demand".
  const attempts = [LLM.answer, LLM.fallback, LLM.fallback];
  for (const [i, target] of attempts.entries()) {
    if (i === 2) await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const stream = llm(target.provider).stream(
        {
          model: target.model,
          messages,
          maxOutputTokens: target.maxOutputTokens,
          temperature: target.temperature,
          reasoningEffort: "reasoningEffort" in target ? target.reasoningEffort : undefined,
        },
        context.signal
      );
      let next = await stream.next(); // errors like 429 surface here, before any text
      model = target.model;
      while (!next.done) {
        raw += next.value;
        yield { type: "delta", text: next.value };
        next = await stream.next();
      }
      addUsage(next.value);
      break;
    } catch (error) {
      console.warn(`[rag] ${target.provider} failed:`, error instanceof Error ? error.message : error);
      if (raw) break; // part of an answer was already streamed — keep it
    }
  }

  if (!raw.trim()) {
    yield await finish(handoff(ragDemo.replies.error, "error"), {
      model: "error:llm",
      rewritten,
      usedChunkIds: chunks.map((c) => c.id),
    });
    return;
  }

  const text = cleanAnswer(raw);
  const usedChunkIds = chunks.map((c) => c.id);

  const cited = citedPassages(raw)
    .map((n) => chunks[n - 1])
    .filter((chunk): chunk is RetrievedChunk => Boolean(chunk));

  // The model says it can't answer from the passages → handoff buttons.
  // A reply that cites passages is an answer, even if the model also added
  // the marker (it occasionally does both).
  if (hasHandoffMarker(raw) && cited.length === 0) {
    yield await finish(handoff(text || ragDemo.replies.noAnswer, "no-answer"), { model, rewritten, usedChunkIds });
    return;
  }
  const sources = (cited.length ? cited : chunks.slice(0, 1)).map((chunk) => toSourceRef(chunk, text));

  const reply: AssistantReply = { type: "answer", text, sources, confidence };
  if (cacheable) await setCachedReply(question, reply);
  yield await finish(reply, { model, rewritten, usedChunkIds });
}
