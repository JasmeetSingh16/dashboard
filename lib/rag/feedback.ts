import "server-only";
import { db, tenantId } from "./db";

/* ------------------------------------------------------------------ */
/* 👍/👎 FEEDBACK on an assistant message                              */
/* ------------------------------------------------------------------ */
/*
 * Only accepted for an assistant message in a conversation that belongs to
 * this tenant AND this visitor (hashed IP), so nobody can rate other
 * people's messages. One rating per message: a new vote replaces the old.
 */

export async function saveFeedback(messageId: string, rating: 1 | -1, visitor: string): Promise<boolean> {
  const tenant = await tenantId();

  const { data: message } = await db()
    .from("messages")
    .select("id, role, conversations!inner(visitor_id)")
    .eq("id", messageId)
    .eq("tenant_id", tenant)
    .eq("role", "assistant")
    .eq("conversations.visitor_id", visitor)
    .maybeSingle();
  if (!message) return false;

  await db().from("feedback").delete().eq("tenant_id", tenant).eq("message_id", messageId);
  const { error } = await db().from("feedback").insert({ tenant_id: tenant, message_id: messageId, rating });
  if (error) throw new Error(error.message);
  return true;
}
