/* ------------------------------------------------------------------ */
/* RAG ASSISTANT CONTRACT                                              */
/* ------------------------------------------------------------------ */
/*
 * The demo UI only talks to a `KnowledgeAssistant`. Today that is the
 * local keyword retriever; later it can be a real backend (embeddings +
 * vector DB + LLM) that returns the same `AssistantReply` JSON.
 */

export type SourceType = "pricing" | "faq" | "policy" | "website";

export type KnowledgeChunk = {
  id: string;
  title: string;
  source: string;
  sourceType: SourceType;
  keywords?: string[];
  text: string;
};

export type KnowledgeBase = {
  chunks: KnowledgeChunk[];
  synonyms?: Record<string, string[]>;
  weakWords?: string[];
};

export type SourceRef = {
  id: string;
  /** Section heading of the passage. */
  title: string;
  /** Document title. */
  source: string;
  sourceType: SourceType;
  /** The single sentence that best supports the answer. */
  highlight: string;
  /** Knowledge file path (live API only), e.g. knowledge/pricing.md. */
  path?: string;
  /** Short document name for chips/cards, e.g. "Pricing" (live API only). */
  document?: string;
  /** The quoted passage text (live API only). */
  passage?: string;
};

export type AssistantReply =
  | {
      type: "answer";
      text: string;
      sources: SourceRef[];
      /** 0–1, how well the question matched the knowledge base. */
      confidence: number;
      /** Logged assistant message id (live API) — used for 👍/👎 feedback. */
      messageId?: string;
    }
  | {
      type: "fallback";
      text: string;
      /** Booking / contact link for the main handoff button. */
      handoffUrl: string;
      /** Button label; defaults to the page's "Contact the Jaseir team". */
      handoffLabel?: string;
      whatsappUrl?: string;
      reason?: "no-answer" | "rate-limited" | "error";
      messageId?: string;
    };

/** Sent by the live API right after retrieval, before the answer streams. */
export type RetrievalInfo = { count: number; documents: string[]; paths: string[] };

export type AskOptions = {
  signal?: AbortSignal;
  onRetrieval?: (info: RetrievalInfo) => void;
  /** Called with the full (cleaned) answer text so far while it streams. */
  onDelta?: (text: string) => void;
};

export interface KnowledgeAssistant {
  ask(question: string, options?: AskOptions): Promise<AssistantReply>;
}
