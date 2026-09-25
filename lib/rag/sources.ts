import "server-only";
import { docLabel } from "@/app/lib/rag/format";
import { db, tenantId } from "./db";

/* ------------------------------------------------------------------ */
/* KNOWLEDGE SOURCES — real documents + passage counts for the UI      */
/* ------------------------------------------------------------------ */

export type KnowledgeSource = { path: string; title: string; label: string; passages: number };

let cache: { at: number; value: KnowledgeSource[] } | null = null;

/** Documents of the tenant with their chunk counts (cached for 60 s). */
export async function listSources(): Promise<KnowledgeSource[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.value;

  const { data, error } = await db()
    .from("documents")
    .select("path, title, chunks(count)")
    .eq("tenant_id", await tenantId())
    .order("path");
  if (error) throw new Error(error.message);

  const value = (data ?? []).map((doc) => ({
    path: doc.path as string,
    title: doc.title as string,
    label: docLabel(doc.path as string),
    passages: (doc.chunks as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
  cache = { at: Date.now(), value };
  return value;
}
