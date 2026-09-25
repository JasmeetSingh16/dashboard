import "server-only";
import { RERANK } from "../config";
import { runModel } from "./cloudflare";

/* ------------------------------------------------------------------ */
/* RERANK ADAPTER (only used when RERANK_ENABLED=true)                 */
/* ------------------------------------------------------------------ */
/*
 * Cloudflare Workers AI — @cf/baai/bge-reranker-base.
 * Request:  { query, contexts: [{ text }], top_k }
 * Response: [{ id (index into contexts), score (0–1) }]
 */

export type RerankScore = { index: number; score: number };

export async function rerank(query: string, documents: string[], topK: number): Promise<RerankScore[]> {
  if (documents.length === 0) return [];

  type Item = { id: number; score: number };
  const result = await runModel<{ response: Item[] } | Item[]>(RERANK.model, {
    query,
    contexts: documents.map((text) => ({ text })),
    top_k: topK,
  });
  const items = Array.isArray(result) ? result : result.response;

  return items
    .map((item) => ({ index: item.id, score: item.score }))
    .sort((a, b) => b.score - a.score);
}
