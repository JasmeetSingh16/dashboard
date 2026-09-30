import { normalizeSite, validateBookCall, type BookCallInput } from "@/app/lib/book-call";
import { sendLeadEmail } from "@/lib/lead-email";
import { checkLeadLimit, clientIp } from "@/lib/leads";
import { db, tenantId } from "@/lib/rag/db";
import { visitorKey } from "@/lib/rag/rate-limit";

/*
 * POST /api/book-call/  { name, email, phone?, website?, need, time?, fax? (honeypot), pageUrl? }
 * → 200 { ok: true } | 400 { ok: false, errors } | 429 { reason: "rate-limited" }
 *
 * Saved to the Supabase `leads` table (source 'book_call') and emailed via
 * SMTP like every other lead. If saving fails, the request is still emailed
 * and logged so it isn't lost.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (value: unknown, max = 2000) => (typeof value === "string" ? value.slice(0, max) : "");

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ ok: false }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false }, { status: 400 });

  // Honeypot: real visitors never see or fill this field. Pretend success.
  if (text(body.fax).trim()) return Response.json({ ok: true });

  const input: BookCallInput = {
    name: text(body.name, 200),
    email: text(body.email, 300),
    phone: text(body.phone, 60),
    website: text(body.website, 300),
    need: text(body.need, 2000),
    time: text(body.time, 300),
  };
  const errors = validateBookCall(input);
  if (Object.keys(errors).length > 0) return Response.json({ ok: false, errors }, { status: 400 });

  try {
    if (!(await checkLeadLimit(visitorKey(clientIp(request)), "bookcall", 5))) {
      return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });
    }
  } catch (error) {
    console.error("[book-call] rate limit check failed (allowing):", error);
  }

  const pageUrl = text(body.pageUrl, 500);
  const lead = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim().replace(/\s+/g, " ") || null,
    website: normalizeSite(input.website) || null,
    need: input.need.trim(),
    time: input.time.trim() || null,
    pageUrl: /^https?:\/\//.test(pageUrl) ? pageUrl : null,
  };
  const message = [`What they need: ${lead.need}`, `Best time to talk: ${lead.time ?? "—"}`].join("\n");

  let saveError: string | undefined;
  try {
    const { error } = await db()
      .from("leads")
      .insert({
        tenant_id: await tenantId("jaseir"),
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        message,
        source: "book_call",
        page_url: lead.pageUrl,
        source_page: "/book-a-call/",
        consented_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
  } catch (error) {
    saveError = error instanceof Error ? error.message : String(error);
    console.error("[book-call] save failed:", saveError, JSON.stringify(lead));
  }

  await sendLeadEmail({
    subject: `Call request: ${lead.name}${lead.website ? ` (${lead.website})` : ""}`,
    replyTo: lead.email,
    text: [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `WhatsApp/phone: ${lead.phone ?? "—"}`,
      `Website: ${lead.website ?? "—"}`,
      "",
      message,
      "",
      `Page: ${lead.pageUrl ?? "—"}`,
      ...(saveError ? ["", `⚠ NOT saved to the database: ${saveError}`] : []),
    ].join("\n"),
  });

  return Response.json({ ok: true });
}
