import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RAG } from "@/lib/rag/config";
import { retrieve, type RetrievalResult } from "@/lib/rag/retrieve";
import "./rag-debug.css";

/* ------------------------------------------------------------------ */
/* /rag-debug — retrieval inspector (development only)                 */
/* ------------------------------------------------------------------ */
/*
 * Server component: retrieval runs on the server, keys never reach the
 * browser. Returns 404 whenever NODE_ENV is "production" (next build /
 * next start / any deployed site).
 */

export const metadata: Metadata = {
  title: "RAG debug",
  robots: { index: false, follow: false },
};

const SAMPLES = [
  "How long does setup take?",
  "What does the Growth package cost?",
  "Is my data used to train AI models?",
  "Does it work on WhatsApp?",
  "What's the weather in Paris?",
];

export default async function RagDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rerank?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 500);
  const useRerank = params.rerank === undefined ? RAG.rerankEnabled : params.rerank === "1";

  let result: RetrievalResult | null = null;
  let error: string | null = null;
  if (query) {
    try {
      result = await retrieve(query, { useRerank });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <main className="rd">
      <header className="rd-head">
        <h1>RAG retrieval debug</h1>
        <p>
          Dev only · tenant <code>{RAG.tenantSlug}</code> · top {RAG.topK} · hybrid (vector + full-text, RRF)
          {" · "}MIN_CONFIDENCE <code>{RAG.minConfidence}</code>
        </p>
      </header>

      <form className="rd-form" method="get">
        <input name="q" defaultValue={query} placeholder="Type a question…" autoFocus />
        <label>
          <input type="checkbox" name="rerank" value="1" defaultChecked={useRerank} /> rerank
        </label>
        <button type="submit">Retrieve</button>
      </form>

      <nav className="rd-samples">
        {SAMPLES.map((sample) => (
          <a key={sample} href={`?q=${encodeURIComponent(sample)}`}>
            {sample}
          </a>
        ))}
      </nav>

      {error && <pre className="rd-error">{error}</pre>}

      {result && (
        <>
          <section className="rd-summary">
            <span>
              confidence <b className={result.confidence >= RAG.minConfidence ? "ok" : "low"}>{result.confidence.toFixed(3)}</b>
              {result.confidence >= RAG.minConfidence ? " ≥ threshold → would answer" : " < threshold → would hand off"}
            </span>
            <span>
              {result.reranked ? "reranked" : "no rerank"} · embed {result.timings.embedMs}ms · search {result.timings.searchMs}ms
              {result.reranked && ` · rerank ${result.timings.rerankMs}ms`} · total {result.timings.totalMs}ms
            </span>
          </section>

          {result.chunks.length === 0 && <p className="rd-empty">No chunks found. Has `npm run ingest` been run?</p>}

          <ol className="rd-list">
            {result.chunks.map((chunk, i) => (
              <li key={chunk.id}>
                <div className="rd-meta">
                  <strong>
                    #{i + 1} {chunk.title}
                  </strong>
                  <span>{chunk.sectionHeading}</span>
                  <code>{chunk.path}{chunk.page ? ` p.${chunk.page}` : ""}</code>
                </div>
                <div className="rd-scores">
                  <span>RRF <b>{chunk.rrf.toFixed(4)}</b></span>
                  <span>
                    vector {chunk.vector ? <>#{chunk.vector.rank} · sim <b>{chunk.vector.similarity.toFixed(3)}</b></> : "—"}
                  </span>
                  <span>
                    keyword {chunk.keyword ? <>#{chunk.keyword.rank} · <b>{chunk.keyword.score.toFixed(3)}</b></> : "—"}
                  </span>
                  {chunk.rerank !== null && <span>rerank <b>{chunk.rerank.toFixed(3)}</b></span>}
                </div>
                <details>
                  <summary>{chunk.content.replace(/\s+/g, " ").slice(0, 160)}…</summary>
                  <pre>{chunk.content}</pre>
                </details>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
