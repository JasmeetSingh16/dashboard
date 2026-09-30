import "server-only";
import { timingSafeEqual, createHash } from "node:crypto";
import { getAgent } from "./agents";
import type { GatedAgent } from "./lead-gate";
import { sendLeadEmail } from "./lead-email";
import { isMissingColumn } from "./leads";
import { db, tenantId } from "./rag/db";

/* ------------------------------------------------------------------ */
/* AGENT REPORT LEADS — "Get your full report" form on the free agents */
/* ------------------------------------------------------------------ */
/*
 * Stored in the same Supabase `leads` table as the RAG demo form
 * (tenant "jaseir", source = 'agent_report'), so there is one list of
 * every lead. Columns come from supabase/migrations/0004; until it is
 * run, the details are folded into `message` instead of being lost.
 */

/** Unlocks per visitor (hashed IP) per hour. Remembered visitors count too. */
export const AGENT_LEADS_PER_HOUR = 12;

export type AgentLead = {
  name: string;
  email: string;
  website: string | null;
  agent: GatedAgent;
  input: string;
  summary: string;
  pageUrl: string | null;
  isReturning: boolean;
  /** Signed in with Google (verified email) instead of typing the form. */
  viaGoogle: boolean;
};

export async function saveAgentLead(lead: AgentLead): Promise<void> {
  const consentedAt = new Date().toISOString();
  let sourcePage: string | null = null;
  try {
    sourcePage = lead.pageUrl ? new URL(lead.pageUrl).pathname : null;
  } catch {
    /* not a URL — keep null */
  }
  const base = { tenant_id: await tenantId("jaseir"), name: lead.name, email: lead.email };

  const { error } = await db()
    .from("leads")
    .insert({
      ...base,
      website: lead.website,
      source: "agent_report",
      agent: lead.agent,
      agent_input: lead.input,
      result_summary: lead.summary,
      page_url: lead.pageUrl,
      source_page: sourcePage,
      is_returning: lead.isReturning,
      message: lead.viaGoogle ? "Signed in with Google" : null,
      consented_at: consentedAt,
    });
  if (!error) return;
  if (!isMissingColumn(error)) throw new Error(error.message);

  console.warn("[agent-leads] columns missing — run supabase/migrations/0003 and 0004. Saving details in `message`.");
  const retry = await db().from("leads").insert({ ...base, message: detailLines(lead, consentedAt).join("\n") });
  if (retry.error) throw new Error(retry.error.message);
}

function detailLines(lead: AgentLead, at: string): string[] {
  return [
    `Source: agent report (${getAgent(lead.agent).name})`,
    `Website: ${lead.website ?? "—"}`,
    `Agent input: ${lead.input || "—"}`,
    `Result: ${lead.summary || "—"}`,
    `Page: ${lead.pageUrl ?? "—"}`,
    `Returning visitor: ${lead.isReturning ? "yes" : "no"}`,
    `Signed in with Google: ${lead.viaGoogle ? "yes (verified email)" : "no"}`,
    `Submitted: ${at}`,
  ];
}

/** Emails the team about a new lead. `saveError` is included if saving failed. */
export async function notifyAgentLead(lead: AgentLead, saveError?: string): Promise<void> {
  const agent = getAgent(lead.agent).name;
  const lines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    ...detailLines(lead, new Date().toISOString()),
  ];
  if (saveError) lines.push("", `⚠ NOT saved to the database: ${saveError}`);
  await sendLeadEmail({ subject: `New lead from ${agent}: ${lead.name}`, text: lines.join("\n"), replyTo: lead.email });
}

/* ------------------------------------------------------------------ */
/* Admin: list + CSV (protected by LEADS_ADMIN_KEY)                    */
/* ------------------------------------------------------------------ */

/** Constant-time check of the admin key. False when no key is configured. */
export function isAdmin(provided: string | null): boolean {
  const expected = process.env.LEADS_ADMIN_KEY?.trim();
  if (!expected || expected.length < 16 || !provided) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(provided), hash(expected));
}

export const LEAD_COLUMNS = [
  "created_at",
  "source",
  "agent",
  "name",
  "email",
  "website",
  "company",
  "industry",
  "phone",
  "agent_input",
  "result_summary",
  "message",
  "page_url",
  "source_page",
  "is_returning",
] as const;

export type LeadRow = Partial<Record<(typeof LEAD_COLUMNS)[number], string | boolean | null>> & { id: string };

/** Newest first. Uses `*` so it works before migrations 0003/0004 are run. */
export async function listLeads(limit = 2000): Promise<LeadRow[]> {
  const { data, error } = await db()
    .from("leads")
    .select("*")
    .eq("tenant_id", await tenantId("jaseir"))
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LeadRow[];
}

export function leadsToCsv(rows: LeadRow[]): string {
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    // Stop spreadsheet apps from running cell text as a formula.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [LEAD_COLUMNS.join(","), ...rows.map((row) => LEAD_COLUMNS.map((column) => cell(row[column])).join(","))].join(
    "\r\n",
  );
}
