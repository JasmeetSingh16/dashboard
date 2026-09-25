import { saveFeedback } from "@/lib/rag/feedback";
import { visitorKey } from "@/lib/rag/rate-limit";

/* POST /api/rag/feedback/  { messageId: uuid, rating: 1 | -1 } */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ ok: false }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { messageId?: unknown; rating?: unknown } | null;
  const messageId = typeof body?.messageId === "string" ? body.messageId : "";
  const rating = body?.rating === 1 || body?.rating === -1 ? body.rating : null;
  if (!UUID.test(messageId) || rating === null) return Response.json({ ok: false }, { status: 400 });

  try {
    const ok = await saveFeedback(messageId, rating, visitorKey(clientIp(request)));
    return Response.json({ ok }, { status: ok ? 200 : 404 });
  } catch (error) {
    console.error("[rag] feedback failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
