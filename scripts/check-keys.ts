/* ------------------------------------------------------------------ */
/* npm run rag:check — one small call per service, prints pass/fail    */
/* ------------------------------------------------------------------ */
/* Never prints key values. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const results: { check: string; ok: boolean; detail: string }[] = [];
const record = (check: string, ok: boolean, detail: string) => results.push({ check, ok, detail });

async function main() {
  const { EMBEDDING, RERANK } = await import("../lib/rag/config");
  const { db } = await import("../lib/rag/db");
  const { embedQuery } = await import("../lib/rag/providers/embeddings");
  const { rerank } = await import("../lib/rag/providers/rerank");

  // Supabase: key works + migration state
  try {
    const { data, error } = await db().from("tenants").select("slug");
    if (error) {
      const missing = error.code === "PGRST205" || error.code === "42P01" || /does not exist|schema cache/i.test(error.message);
      // "Table not found" means the key was accepted; anything else is a key problem.
      record("Supabase secret key", missing, missing ? "key accepted" : error.message);
      record("Migration 0001 applied", false, missing ? "tenants table not found — run the migration" : error.message);
    } else {
      record("Supabase secret key", true, "query succeeded");
      const seeded = (data ?? []).some((row) => row.slug === "jaseir");
      record("Migration 0001 applied", seeded, seeded ? "tenants table exists, 'jaseir' seeded" : "tenants table exists but 'jaseir' missing");
      const { count } = await db().from("chunks").select("id", { count: "exact", head: true });
      record("Chunks in database", true, `${count ?? 0} rows`);
    }
  } catch (error) {
    record("Supabase secret key", false, error instanceof Error ? error.message : String(error));
  }

  // Cloudflare: embeddings
  try {
    const vector = await embedQuery("hello");
    record(`Cloudflare embeddings (${EMBEDDING.model})`, vector.length === EMBEDDING.dimensions, `${vector.length} dimensions`);
  } catch (error) {
    record(`Cloudflare embeddings (${EMBEDDING.model})`, false, error instanceof Error ? error.message : String(error));
  }

  // Cloudflare: reranker (tested even though RERANK_ENABLED defaults to false)
  try {
    const scores = await rerank("What does it cost?", ["Our prices start at $10.", "We are based in Europe."], 2);
    const ok = scores.length === 2 && scores[0].index === 0;
    record(`Cloudflare reranker (${RERANK.model})`, ok, scores.map((s) => `#${s.index}=${s.score.toFixed(3)}`).join(" "));
  } catch (error) {
    record(`Cloudflare reranker (${RERANK.model})`, false, error instanceof Error ? error.message : String(error));
  }

  // Groq + Gemini: a tiny completion each (a few tokens).
  const { LLM } = await import("../lib/rag/config");
  const { llm } = await import("../lib/rag/providers/llm");
  const ping = [{ role: "user" as const, content: "Reply with the single word: pong" }];
  for (const target of [LLM.rewrite, LLM.answer, LLM.fallback]) {
    try {
      const { text, usage } = await llm(target.provider).complete({
        model: target.model,
        messages: ping,
        maxOutputTokens: 200,
        temperature: 0,
        reasoningEffort: "reasoningEffort" in target ? target.reasoningEffort : undefined,
      });
      record(`${target.provider} ${target.model}`, /pong/i.test(text), `replied "${text.slice(0, 20)}" · ${usage.promptTokens}+${usage.completionTokens} tokens`);
    } catch (error) {
      record(`${target.provider} ${target.model}`, false, error instanceof Error ? error.message.slice(0, 160) : String(error));
    }
  }

  // Upstash: write + read + expire a throwaway key.
  const { redis, redisConfigured } = await import("../lib/rag/redis");
  try {
    if (!redisConfigured()) throw new Error("UPSTASH_REDIS_REST_URL / _TOKEN not set");
    const [, value] = await redis([["SET", "rag:check", "ok", "EX", 60], ["GET", "rag:check"]]);
    record("Upstash Redis", value === "ok", "SET/GET round trip");
  } catch (error) {
    record("Upstash Redis", false, error instanceof Error ? error.message : String(error));
  }

  for (const { check, ok, detail } of results) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${check.padEnd(46)} ${detail}`);
  }
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main();
