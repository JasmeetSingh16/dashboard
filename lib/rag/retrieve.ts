import "server-only";
import { RAG } from "./config";
import { db, tenantId as resolveTenantId } from "./db";
import { embedQuery } from "./providers/embeddings";
import { rerank } from "./providers/rerank";

/* ------------------------------------------------------------------ */
/* HYBRID RETRIEVAL                                                    */
/* ------------------------------------------------------------------ */
/*
 * 1. Vector search (meaning) and full-text search (exact words) run in
 *    parallel, each returning up to CANDIDATES chunks — always filtered by
 *    tenant inside the SQL functions (supabase/migrations/0002).
 * 2. Reciprocal rank fusion merges the two lists using ranks only, so the
 *    very different score scales don't matter:  rrf = Σ 1 / (k + rank).
 * 3. Optional rerank (RERANK_ENABLED) re-scores the fused candidates.
 * 4. Top K are returned with every intermediate score for debugging.
 *
 * `confidence` is what Phase 3 compares against MIN_CONFIDENCE: the best
 * rerank score in the top K when reranking, otherwise the best cosine
 * similarity.
 * (RRF scores only say "better than the others", not "actually relevant".)
 */

const RRF_K = 60; // standard constant from the RRF paper
const CANDIDATES = 20;

type Row = {
  id: string;
  document_id: string;
  title: string;
  path: string;
  section_heading: string | null;
  page: number | null;
  content: string;
};

export type RetrievedChunk = {
  id: string;
  documentId: string;
  title: string;
  path: string;
  sectionHeading: string | null;
  page: number | null;
  content: string;
  vector: { rank: number; similarity: number } | null;
  keyword: { rank: number; score: number } | null;
  rrf: number;
  rerank: number | null;
};

export type RetrievalResult = {
  query: string;
  chunks: RetrievedChunk[];
  confidence: number;
  reranked: boolean;
  timings: { embedMs: number; searchMs: number; rerankMs: number; totalMs: number };
};

export async function retrieve(
  query: string,
  { tenantSlug = RAG.tenantSlug, topK = RAG.topK, useRerank = RAG.rerankEnabled } = {}
): Promise<RetrievalResult> {
  const started = performance.now();
  const tenant = await resolveTenantId(tenantSlug);

  const embedding = await embedQuery(query);
  const embedded = performance.now();

  const [vectorResult, keywordResult] = await Promise.all([
    db().rpc("match_chunks_vector", { p_tenant_id: tenant, p_embedding: embedding, p_count: CANDIDATES }),
    db().rpc("match_chunks_fts", { p_tenant_id: tenant, p_query: query, p_count: CANDIDATES }),
  ]);
  if (vectorResult.error) throw new Error(`Vector search failed: ${vectorResult.error.message}`);
  if (keywordResult.error) throw new Error(`Keyword search failed: ${keywordResult.error.message}`);
  const searched = performance.now();

  // Reciprocal rank fusion (ranks are 1-based).
  const fused = new Map<string, RetrievedChunk>();
  const entry = (row: Row): RetrievedChunk => {
    let chunk = fused.get(row.id);
    if (!chunk) {
      chunk = {
        id: row.id,
        documentId: row.document_id,
        title: row.title,
        path: row.path,
        sectionHeading: row.section_heading,
        page: row.page,
        content: row.content,
        vector: null,
        keyword: null,
        rrf: 0,
        rerank: null,
      };
      fused.set(row.id, chunk);
    }
    return chunk;
  };

  (vectorResult.data as (Row & { similarity: number })[]).forEach((row, i) => {
    const chunk = entry(row);
    chunk.vector = { rank: i + 1, similarity: row.similarity };
    chunk.rrf += 1 / (RRF_K + i + 1);
  });
  (keywordResult.data as (Row & { rank: number })[]).forEach((row, i) => {
    const chunk = entry(row);
    chunk.keyword = { rank: i + 1, score: row.rank };
    chunk.rrf += 1 / (RRF_K + i + 1);
  });

  let ranked = [...fused.values()].sort((a, b) => b.rrf - a.rrf);

  let reranked = false;
  const beforeRerank = performance.now();
  if (useRerank && ranked.length > 0) {
    const pool = ranked.slice(0, CANDIDATES);
    const scores = await rerank(query, pool.map((c) => `${c.title} — ${c.sectionHeading ?? ""}\n${c.content}`), pool.length);
    for (const { index, score } of scores) pool[index].rerank = score;
    ranked = pool.sort((a, b) => (b.rerank ?? 0) - (a.rerank ?? 0));
    reranked = true;
  }
  const finished = performance.now();

  const chunks = ranked.slice(0, topK);
  const confidence = Math.max(
    0,
    ...chunks.map((c) => (reranked ? c.rerank ?? 0 : c.vector?.similarity ?? 0))
  );

  return {
    query,
    chunks,
    confidence,
    reranked,
    timings: {
      embedMs: Math.round(embedded - started),
      searchMs: Math.round(searched - embedded),
      rerankMs: Math.round(finished - beforeRerank),
      totalMs: Math.round(finished - started),
    },
  };
}
