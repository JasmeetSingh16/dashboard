import "server-only";
import { ragDemo } from "@/app/data/rag-page";
import type { AssistantReply } from "@/app/lib/rag/types";
import { CACHE } from "./config";
import { db, tenantId } from "./db";
import { redis } from "./redis";

/* ------------------------------------------------------------------ */
/* ANSWER CACHE for the preset demo questions                          */
/* ------------------------------------------------------------------ */
/*
 * Only the questions shown as buttons (suggestions, follow-ups and the
 * auto-played question) are cached, and only when asked without chat
 * history. A repeat costs no LLM call and no rate-limit slot.
 *
 * The key includes a "knowledge version" (latest document update), so
 * re-running `npm run ingest` automatically invalidates old answers.
 */

const normalize = (q: string) => q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const CACHEABLE = new Set(
  [ragDemo.autoplayQuestion, ...ragDemo.suggestions.map((s) => s.text), ...ragDemo.followUps].map(normalize)
);

/** Every preset question shown in the UI (used by scripts/warm-cache.ts). */
export const PRESET_QUESTIONS = [
  ...new Set([ragDemo.autoplayQuestion, ...ragDemo.suggestions.map((s) => s.text), ...ragDemo.followUps]),
];

export const isCacheable = (question: string, hasHistory: boolean) =>
  !hasHistory && CACHEABLE.has(normalize(question));

let version: { value: string; at: number } | null = null;

/** Latest document update for the tenant, refreshed at most once a minute. */
async function knowledgeVersion(): Promise<string> {
  if (version && Date.now() - version.at < 60_000) return version.value;
  const { data } = await db()
    .from("documents")
    .select("updated_at")
    .eq("tenant_id", await tenantId())
    .order("updated_at", { ascending: false })
    .limit(1);
  version = { value: data?.[0]?.updated_at ?? "none", at: Date.now() };
  return version.value;
}

const cacheKey = async (question: string) => `rag:answer:${await knowledgeVersion()}:${normalize(question)}`;

export async function getCachedReply(question: string): Promise<AssistantReply | null> {
  try {
    const [raw] = await redis([["GET", await cacheKey(question)]]);
    return typeof raw === "string" ? (JSON.parse(raw) as AssistantReply) : null;
  } catch (error) {
    console.warn("[rag] cache read failed:", error);
    return null;
  }
}

export async function setCachedReply(question: string, reply: AssistantReply): Promise<void> {
  // Only cache real answers — never handoffs or errors.
  if (reply.type !== "answer") return;
  try {
    await redis([["SET", await cacheKey(question), JSON.stringify(reply), "EX", CACHE.ttlSeconds]]);
  } catch (error) {
    console.warn("[rag] cache write failed:", error);
  }
}
