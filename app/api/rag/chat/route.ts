import { ragDemo } from "@/app/data/rag-page";
import { BOOKING_URL, WHATSAPP_URL } from "@/app/data/site-config";
import { runChat, type ChatEvent } from "@/lib/rag/chat";
import { LIMITS } from "@/lib/rag/config";
import type { HistoryMessage } from "@/lib/rag/prompt";

/* ------------------------------------------------------------------ */
/* POST /api/rag/chat — streaming answers (newline-delimited JSON)     */
/* ------------------------------------------------------------------ */
/*
 * Request:  { question: string, history?: {role, content}[], conversationId?: string }
 * Response: one JSON event per line —
 *   {"type":"start","conversationId":"…"}
 *   {"type":"delta","text":"…"}            (0..n, raw model text)
 *   {"type":"done","reply":AssistantReply} (always last)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (message: string, status = 400) => Response.json({ error: message }, { status });

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

function parseHistory(value: unknown): HistoryMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is HistoryMessage =>
        m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
}

export async function POST(request: Request) {
  // Only accept calls from this site's own pages.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return bad("Cross-origin requests are not allowed.", 403);

  let body: { question?: unknown; history?: unknown; conversationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return bad("`question` is required.");
  if (question.length > LIMITS.maxQuestionChars) return bad(`Questions are limited to ${LIMITS.maxQuestionChars} characters.`);

  const input = {
    question,
    history: parseHistory(body.history),
    conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of runChat(input, { ip: clientIp(request), signal: request.signal })) send(event);
      } catch (error) {
        console.error("[rag] chat failed:", error);
        send({
          type: "done",
          reply: {
            type: "fallback",
            text: ragDemo.replies.error,
            reason: "error",
            handoffUrl: BOOKING_URL,
            whatsappUrl: WHATSAPP_URL,
          },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no", // don't let nginx buffer the stream when self-hosting
    },
  });
}
