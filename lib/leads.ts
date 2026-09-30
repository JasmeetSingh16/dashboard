import "server-only";
import { LEAD_INDUSTRIES, normalizeWebsite, type LeadInput } from "@/app/lib/leads";
import { sendLeadEmail } from "./lead-email";
import { db, tenantId } from "./rag/db";
import { redis } from "./rag/redis";

/* ------------------------------------------------------------------ */
/* LEADS — "Get one for your business" form                            */
/* ------------------------------------------------------------------ */
/*
 * Saved to the Supabase `leads` table (tenant "jaseir") with the secret
 * key, server-side only. The email notification (lib/lead-email.ts) is
 * optional, and a failed email never fails the request (the lead is
 * already saved).
 */

export const LEADS_PER_HOUR = 3;

/** Fixed hourly window per visitor (hashed IP). */
export async function checkLeadLimit(visitor: string, bucket = "lead", perHour = LEADS_PER_HOUR): Promise<boolean> {
  const key = `rl:${bucket}:${visitor}:${new Date().toISOString().slice(0, 13)}`;
  const [count] = (await redis([
    ["INCR", key],
    ["EXPIRE", key, 60 * 60],
  ])) as number[];
  return count <= perHour;
}

export type Lead = {
  name: string;
  email: string;
  company: string;
  website: string | null;
  industry: string;
  phone: string | null;
  message: string | null;
  sourcePage: string | null;
};

/** Visitor IP from the reverse proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

/** Trims and normalises validated input into the row we store. */
export function toLead(input: LeadInput, sourcePage: string | null): Lead {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company.trim(),
    website: normalizeWebsite(input.website) || null,
    industry: input.industry,
    phone: input.phone.trim().replace(/\s+/g, " ") || null,
    message: input.message.trim() || null,
    sourcePage,
  };
}

/** "column does not exist" — migration 0003 (form columns) hasn't been run yet. */
export const isMissingColumn = (error: { code?: string; message: string }) =>
  error.code === "PGRST204" || error.code === "42703" || /column .* (does not exist|in the schema cache)/i.test(error.message);

export async function saveLead(lead: Lead): Promise<void> {
  const consentedAt = new Date().toISOString();
  const base = { tenant_id: await tenantId("jaseir"), name: lead.name, email: lead.email, phone: lead.phone };

  const { error } = await db()
    .from("leads")
    .insert({
      ...base,
      company: lead.company,
      website: lead.website,
      industry: lead.industry,
      message: lead.message,
      source_page: lead.sourcePage,
      consented_at: consentedAt,
    });
  if (!error) return;
  if (!isMissingColumn(error)) throw new Error(error.message);

  // Fallback until supabase/migrations/0003_leads_form.sql is run: keep every
  // detail by folding the new fields into `message` (the 0001 columns only).
  console.warn("[leads] form columns missing — run supabase/migrations/0003_leads_form.sql. Saving details in `message`.");
  const details = [
    `Company: ${lead.company}`,
    `Website: ${lead.website ?? "—"}`,
    `Industry: ${lead.industry}`,
    `Page: ${lead.sourcePage ?? "—"}`,
    `Consented at: ${consentedAt}`,
    "",
    lead.message ?? "",
  ].join("\n").trim();
  const retry = await db().from("leads").insert({ ...base, message: details });
  if (retry.error) throw new Error(retry.error.message);
}

/** Emails the team (SMTP, or Resend for older setups). Never throws. */
export async function notifyLead(lead: Lead): Promise<void> {
  const industry = LEAD_INDUSTRIES.find((option) => option.value === lead.industry)?.label ?? lead.industry;
  const lines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Website: ${lead.website ?? "—"}`,
    `Industry: ${industry}`,
    `WhatsApp/phone: ${lead.phone ?? "—"}`,
    `Page: ${lead.sourcePage ?? "—"}`,
    "",
    "What should the assistant answer?",
    lead.message ?? "—",
  ];

  await sendLeadEmail({
    subject: `New demo request: ${lead.company} (${industry})`,
    text: lines.join("\n"),
    replyTo: lead.email,
  });
}
