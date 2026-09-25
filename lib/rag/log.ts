import "server-only";
import { db } from "./db";

/* ------------------------------------------------------------------ */
/* CONVERSATION LOGGING (best effort — never breaks the chat)          */
/* ------------------------------------------------------------------ */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reuses the visitor's conversation if it belongs to this tenant, else starts one. */
export async function ensureConversation(tenant: string, visitor: string, conversationId?: string): Promise<string | null> {
  try {
    if (conversationId && UUID.test(conversationId)) {
      const { data } = await db()
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("tenant_id", tenant)
        .eq("visitor_id", visitor)
        .maybeSingle();
      if (data) return data.id;
    }
    const { data, error } = await db()
      .from("conversations")
      .insert({ tenant_id: tenant, visitor_id: visitor })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.warn("[rag] could not create conversation:", error);
    return null;
  }
}

export type ExchangeLog = {
  tenant: string;
  conversationId: string | null;
  question: string;
  rewrittenQuestion: string | null;
  answer: string;
  usedChunkIds: string[];
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
};

/** Returns the id of the logged assistant message (for 👍/👎 feedback). */
export async function logExchange(log: ExchangeLog): Promise<string | null> {
  if (!log.conversationId) return null;
  try {
    const { data, error } = await db()
      .from("messages")
      .insert([
        {
          tenant_id: log.tenant,
          conversation_id: log.conversationId,
          role: "user",
          content: log.question,
          rewritten_question: log.rewrittenQuestion,
          // Multi-row inserts need the same columns in every row, otherwise
          // PostgREST sends NULL (not the default) for the missing ones.
          used_chunk_ids: [],
          model: null,
          prompt_tokens: null,
          completion_tokens: null,
          tokens: null,
          latency_ms: null,
        },
        {
          tenant_id: log.tenant,
          conversation_id: log.conversationId,
          role: "assistant",
          content: log.answer,
          rewritten_question: null,
          used_chunk_ids: log.usedChunkIds,
          model: log.model,
          prompt_tokens: log.promptTokens,
          completion_tokens: log.completionTokens,
          tokens: log.promptTokens + log.completionTokens,
          latency_ms: log.latencyMs,
        },
      ])
      .select("id, role");
    if (error) throw error;
    return data?.find((row) => row.role === "assistant")?.id ?? null;
  } catch (error) {
    console.warn("[rag] could not log exchange:", error);
    return null;
  }
}
