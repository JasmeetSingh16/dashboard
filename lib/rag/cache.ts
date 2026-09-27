import "server-only";
import { DEMO_IDS, presetQuestions, type DemoId } from "@/app/data/rag-demos";
import type { AssistantReply } from "@/app/lib/rag/types";
import { CACHE } from "./config";
import { db, tenantId } from "./db";
import { redis } from "./redis";

/* ------------------------------------------------------------------ */
/* ANSWER CACHE for the preset demo questions                          */
/* ------------------------------------------------------------------ */
/*
 * Only the questions shown as buttons (per tenant: suggestions, follow-ups,
 * the auto-played question and the industry card question) are cached, and
 * only when asked without chat history. A repeat costs no LLM call and no rate-limit slot.
 *
 * The key includes a "knowledge version" (latest document update), so
 * re-running `npm run ingest` automatically invalidates old answers.
 */

const normalize = (q: string) => q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const cacheable = new Map<DemoId, Set<string>>(
  DEMO_IDS.map((id) => [id, new Set(presetQuestions(id).map(normalize))])
);

/** Every preset question of a tenant (used by scripts/warm-cache.ts). */
export const presetQuestionsFor = (tenant: DemoId) => presetQuestions(tenant);

export const isCacheable = (tenant: DemoId, question: string, hasHistory: boolean) =>
  !hasHistory && Boolean(cacheable.get(tenant)?.has(normalize(question)));

const versions = new Map<DemoId, { value: string; at: number }>();

/** Latest document update for the tenant, refreshed at most once a minute. */
async function knowledgeVersion(tenant: DemoId): Promise<string> {
  const cached = versions.get(tenant);
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  const { data } = await db()
    .from("documents")
    .select("updated_at")
    .eq("tenant_id", await tenantId(tenant))
    .order("updated_at", { ascending: false })
    .limit(1);
  const value = data?.[0]?.updated_at ?? "none";
  versions.set(tenant, { value, at: Date.now() });
  return value;
}

const cacheKey = async (tenant: DemoId, question: string) =>
  `rag:answer:${tenant}:${await knowledgeVersion(tenant)}:${normalize(question)}`;

export async function getCachedReply(tenant: DemoId, question: string): Promise<AssistantReply | null> {
  try {
    const [raw] = await redis([["GET", await cacheKey(tenant, question)]]);
    return typeof raw === "string" ? (JSON.parse(raw) as AssistantReply) : null;
  } catch (error) {
    console.warn("[rag] cache read failed:", error);
    return null;
  }
}

export async function setCachedReply(tenant: DemoId, question: string, reply: AssistantReply): Promise<void> {
  // Only cache real answers — never handoffs or errors.
  if (reply.type !== "answer") return;
  try {
    await redis([["SET", await cacheKey(tenant, question), JSON.stringify(reply), "EX", CACHE.ttlSeconds]]);
  } catch (error) {
    console.warn("[rag] cache write failed:", error);
  }
}
