import { validateLead, type LeadInput } from "@/app/lib/leads";
import { checkLeadLimit, notifyLead, saveLead, toLead } from "@/lib/leads";
import { visitorKey } from "@/lib/rag/rate-limit";

/*
 * POST /api/leads/  { name, email, company, website?, industry, phone?, message?,
 *                     consent: true, sourcePage?, fax? (honeypot, must be empty) }
 * → 200 { ok: true } | 400 { ok: false, errors } | 429 { ok: false, reason: "rate-limited" } | 500
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

const text = (value: unknown, max = 2000) => (typeof value === "string" ? value.slice(0, max) : "");

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ ok: false }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false }, { status: 400 });

  // Honeypot: real visitors never see or fill this field. Pretend success.
  if (text(body.fax).trim()) return Response.json({ ok: true });

  const input: LeadInput = {
    name: text(body.name),
    email: text(body.email),
    company: text(body.company),
    website: text(body.website),
    industry: text(body.industry),
    phone: text(body.phone),
    message: text(body.message),
    consent: body.consent === true,
  };
  const errors = validateLead(input);
  if (Object.keys(errors).length > 0) return Response.json({ ok: false, errors }, { status: 400 });

  const page = text(body.sourcePage, 200);
  const sourcePage = page.startsWith("/") ? page : null;

  try {
    if (!(await checkLeadLimit(visitorKey(clientIp(request))))) {
      return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });
    }
    const lead = toLead(input, sourcePage);
    await saveLead(lead);
    await notifyLead(lead);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[leads] save failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
