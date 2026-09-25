/* ------------------------------------------------------------------ */
/* RAG BACKEND CONFIG — the single source of truth                     */
/* ------------------------------------------------------------------ */
/*
 * Server-only. Nothing here is exposed to the browser (no NEXT_PUBLIC_).
 *
 * EMBEDDINGS: the model + dimensions below MUST match the `vector(...)`
 * size in supabase/migrations/0001_rag_schema.sql. Every document row
 * records the model it was embedded with, so `npm run ingest` re-embeds
 * everything automatically if you ever change the model here.
 */

export const EMBEDDING = {
  provider: "cloudflare", // Cloudflare Workers AI (free: 10,000 neurons/day)
  model: "@cf/baai/bge-m3", // multilingual
  dimensions: 1024, // keep in sync with vector(1024) in the migration
  batchSize: 16, // texts per API call during ingestion
} as const;

export const RERANK = {
  model: "@cf/baai/bge-reranker-base",
} as const;

export const CHUNKING = {
  // "pack":    merge consecutive sections into ~minTokens–maxTokens chunks.
  // "section": one chunk per heading section (long ones still split at
  //            maxTokens). Better precision for short, FAQ-style content.
  strategy: "section" as "pack" | "section",
  // Token counts are estimated as characters / 4 (good enough for English
  // prose; avoids shipping a tokenizer).
  minTokens: 500,
  maxTokens: 800,
  overlapRatio: 0.1, // ~10% of the previous chunk is repeated at the start
} as const;

export const RAG = {
  tenantSlug: "jaseir",
  knowledgeDir: "knowledge",
  // Used from Phase 2/3 onwards.
  topK: 5,
  rerankEnabled: process.env.RERANK_ENABLED === "true",
  // Best cosine similarity (bge-m3) needed before the LLM is called.
  // Measured: real questions 0.52–0.73, off-topic 0.33–0.44.
  minConfidence: Number(process.env.RAG_MIN_CONFIDENCE || 0.5),
} as const;

/* ------------------------------------------------------------------ */
/* ANSWERING (Phase 3)                                                 */
/* ------------------------------------------------------------------ */

export const LLM = {
  // Groq free plan (both models): 30 req/min, 1K req/day, 8K tokens/min,
  // 200K tokens/day. Llama 3.x models were retired by Groq on 2026-08-16.
  answer: {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    reasoningEffort: "low",
    // Includes the (hidden) reasoning tokens. Keeps each request well
    // under the 8K tokens/min limit.
    maxOutputTokens: 600,
    temperature: 0.2,
  },
  rewrite: {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    reasoningEffort: "low",
    maxOutputTokens: 200,
    temperature: 0,
  },
  // Used when Groq returns 429 (or is down). Free tier: content may be used
  // by Google to improve its products — acceptable for Jaseir's own public
  // demo content only (noted in the demo disclaimer).
  fallback: {
    provider: "gemini",
    model: "gemini-3.5-flash",
    maxOutputTokens: 600,
    temperature: 0.2,
  },
  // Prompt budget: at most topK passages, each cut to this many characters.
  maxPassageChars: 1000,
  historyMessages: 4, // previous messages used to rewrite follow-ups
} as const;

export const LIMITS = {
  // Per visitor (hashed IP). Cached answers don't count.
  perHour: 20,
  perDay: 10,
  maxQuestionChars: 500,
} as const;

export const CACHE = {
  ttlSeconds: 60 * 60 * 24,
} as const;

/** Which hero file card lights up for each knowledge file. */
export const SOURCE_CARD_BY_PATH: Record<string, "pricing" | "faq" | "policy" | "website"> = {
  "knowledge/pricing.md": "pricing",
  "knowledge/faq.md": "faq",
  "knowledge/privacy.md": "policy",
  "knowledge/services.md": "website",
  "knowledge/process.md": "website",
};

/** Reads a required server-side env var with a helpful error. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to .env.local (see .env.example).`);
  }
  return value;
}
