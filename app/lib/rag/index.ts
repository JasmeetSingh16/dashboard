import knowledgeBase from "@/app/data/rag-knowledge-base.json";
import { cleanAnswer } from "./format";
import { createLocalAssistant, FALLBACK_TEXT } from "./local-assistant";
import type { AskOptions, AssistantReply, KnowledgeAssistant, KnowledgeBase, RetrievalInfo } from "./types";

export type { AssistantReply, KnowledgeAssistant, RetrievalInfo, SourceRef, SourceType } from "./types";
export { FALLBACK_TEXT };

/* ------------------------------------------------------------------ */
/* ASSISTANT FACTORY (browser)                                         */
/* ------------------------------------------------------------------ */
/*
 * Default: the real RAG backend at /api/rag/chat (streaming NDJSON, see
 * app/api/rag/chat/route.ts). Set NEXT_PUBLIC_RAG_MODE=local to use the
 * old offline keyword demo instead (no keys needed).
 */

const HISTORY_LIMIT = 4;

type HistoryMessage = { role: "user" | "assistant"; content: string };
type StreamEvent =
  | { type: "start"; conversationId: string | null }
  | ({ type: "retrieval" } & RetrievalInfo)
  | { type: "delta"; text: string }
  | { type: "done"; reply: AssistantReply };

function createHttpAssistant(endpoint: string, handoffUrl: string): KnowledgeAssistant {
  // Per page-view conversation state, so the UI stays unaware of it.
  let conversationId: string | null = null;
  const history: HistoryMessage[] = [];

  const errorReply = (): AssistantReply => ({ type: "fallback", reason: "error", text: FALLBACK_TEXT, handoffUrl });

  return {
    async ask(question, { signal, onDelta, onRetrieval }: AskOptions = {}) {
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, history: history.slice(-HISTORY_LIMIT), conversationId }),
          signal,
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        return errorReply();
      }
      if (!response.ok || !response.body) return errorReply();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let raw = "";
      let reply: AssistantReply | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "start") conversationId = event.conversationId ?? conversationId;
          else if (event.type === "retrieval") onRetrieval?.({ count: event.count, documents: event.documents, paths: event.paths });
          else if (event.type === "delta") {
            raw += event.text;
            onDelta?.(cleanAnswer(raw, { streaming: true }));
          } else if (event.type === "done") reply = event.reply;
        }
        if (done) break;
      }

      if (!reply) return errorReply();
      history.push({ role: "user", content: question }, { role: "assistant", content: reply.text });
      return reply;
    },
  };
}

export function getKnowledgeAssistant(handoffUrl: string): KnowledgeAssistant {
  if (process.env.NEXT_PUBLIC_RAG_MODE === "local") {
    return createLocalAssistant(knowledgeBase as KnowledgeBase, { handoffUrl });
  }
  return createHttpAssistant(process.env.NEXT_PUBLIC_RAG_API_URL || "/api/rag/chat/", handoffUrl);
}
