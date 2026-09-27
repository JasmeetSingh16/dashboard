import "server-only";
import { LEAD_INDUSTRIES, normalizeWebsite, type LeadInput } from "@/app/lib/leads";
import { db, tenantId } from "./rag/db";
import { redis } from "./rag/redis";

/* ------------------------------------------------------------------ */
/* LEADS — "Get one for your business" form                            */
/* ------------------------------------------------------------------ */
/*
 * Saved to the Supabase `leads` table (tenant "jaseir") with the secret
 * key, server-side only. Email notification via Resend is optional: it is
 * sent only when RESEND_API_KEY and LEAD_NOTIFY_EMAIL are both set, and a
 * failed email never fails the request (the lead is already saved).
 */

export const LEADS_PER_HOUR = 3;

/** Fixed hourly window per visitor (hashed IP). */
export async function checkLeadLimit(visitor: string): Promise<boolean> {
  const key = `rl:lead:${visitor}:${new Date().toISOString().slice(0, 13)}`;
  const [count] = (await redis([
    ["INCR", key],
    ["EXPIRE", key, 60 * 60],
  ])) as number[];
  return count <= LEADS_PER_HOUR;
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

export async function saveLead(lead: Lead): Promise<void> {
  const { error } = await db()
    .from("leads")
    .insert({
      tenant_id: await tenantId("jaseir"),
      name: lead.name,
      email: lead.email,
      company: lead.company,
      website: lead.website,
      industry: lead.industry,
      phone: lead.phone,
      message: lead.message,
      source_page: lead.sourcePage,
      consented_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAIL);

/** Sends a plain-text notification. No-op when Resend isn't configured. */
export async function notifyLead(lead: Lead): Promise<void> {
  if (!emailConfigured()) return;

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

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_NOTIFY_FROM || "Jaseir leads <onboarding@resend.dev>",
        to: process.env.LEAD_NOTIFY_EMAIL!.split(",").map((email) => email.trim()),
        reply_to: lead.email,
        subject: `New demo request: ${lead.company} (${industry})`,
        text: lines.join("\n"),
      }),
      cache: "no-store",
    });
    if (!response.ok) console.error(`[leads] Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
  } catch (error) {
    console.error("[leads] email failed:", error);
  }
}
