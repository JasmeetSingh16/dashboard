import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RAG, requireEnv } from "./config";

/* ------------------------------------------------------------------ */
/* SUPABASE (server-only)                                              */
/* ------------------------------------------------------------------ */
/*
 * Uses SUPABASE_SECRET_KEY, which bypasses row-level security — so every
 * query in this codebase filters by tenant_id explicitly. RLS still
 * protects the tables from the public anon key.
 * Never import this file from a client component.
 */

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  client ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

const tenantIds = new Map<string, string>();

/** Looks up (and caches) the tenant's id from its slug. */
export async function tenantId(slug: string = RAG.tenantSlug): Promise<string> {
  const cached = tenantIds.get(slug);
  if (cached) return cached;

  const { data, error } = await db().from("tenants").select("id").eq("slug", slug).single();
  if (error || !data) {
    throw new Error(`Tenant "${slug}" not found. Did you run the migration? (${error?.message ?? "no row"})`);
  }

  tenantIds.set(slug, data.id);
  return data.id;
}
