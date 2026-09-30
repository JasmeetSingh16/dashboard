import {
  AGENT_LEADS_PER_HOUR,
  isAdmin,
  leadsToCsv,
  listLeads,
  notifyAgentLead,
  saveAgentLead,
  type AgentLead,
} from "@/lib/agent-leads";
import { clip, isGatedAgent, normalizeGateWebsite, validateGateLead, type GatedAgent } from "@/lib/lead-gate";
import { checkLeadLimit, clientIp } from "@/lib/leads";
import { visitorKey } from "@/lib/rag/rate-limit";
import { openReport } from "@/lib/report-gate";

/*
 * One endpoint for every gated agent (they're all served from ai.jaseir.com,
 * so the agent apps call it same-origin).
 *
 * POST /api/agent-leads/  { name, email, website?, fax? (honeypot), agent, token | null,
 *                           input?, summary?, pageUrl?, returning? }
 *   → 200 { ok: true, full }       full report (null when the page already has it)
 *   → 400 { ok: false, errors }    | 410 { reason: "expired" } | 429 { reason: "rate-limited" }
 *
 * GET /api/agent-leads/[?format=csv]   header x-admin-key: LEADS_ADMIN_KEY
 *   → { leads: [...] } or a CSV download. 404 when LEADS_ADMIN_KEY isn't set.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (value: unknown, max = 2000) => (typeof value === "string" ? value.slice(0, max) : "");

/* Local development: agent apps run on other ports, so allow localhost origins. */
function devCors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production" || !origin || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: devCors(request) });
}

async function withinLimit(request: Request, bucket: string, perHour: number): Promise<boolean> {
  try {
    return await checkLeadLimit(visitorKey(clientIp(request)), bucket, perHour);
  } catch (error) {
    console.error("[agent-leads] rate limit check failed (allowing):", error);
    return true;
  }
}

export async function POST(request: Request) {
  const cors = devCors(request);
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && !cors["Access-Control-Allow-Origin"] && new URL(origin).host !== host) {
    return json({ ok: false }, 403);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false }, 400);

  // Honeypot: real visitors never see or fill this field. Pretend success.
  if (text(body.fax).trim()) return json({ ok: true, full: null });

  const input = { name: text(body.name, 200), email: text(body.email, 300), website: text(body.website, 300) };
  const errors = validateGateLead(input);
  if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400);

  if (!(await withinLimit(request, "agentlead", AGENT_LEADS_PER_HOUR))) {
    return json({ ok: false, reason: "rate-limited" }, 429);
  }

  // Sealed report: agent, input and summary come from the agent's server.
  let agent: GatedAgent;
  let agentInput: string;
  let summary: string;
  let full: unknown = null;
  const token = text(body.token, 400_000);

  if (token) {
    const opened = openReport(token);
    if (!opened.ok) {
      if (opened.reason === "not-configured") {
        console.error("[agent-leads] REPORT_UNLOCK_SECRET is not set on the dashboard, but an agent sent a sealed report.");
        return json({ ok: false }, 500);
      }
      return json({ ok: false, reason: opened.reason }, opened.reason === "expired" ? 410 : 400);
    }
    ({ agent, input: agentInput, summary, full } = opened.report);
  } else {
    if (!isGatedAgent(body.agent)) return json({ ok: false }, 400);
    agent = body.agent;
    agentInput = clip(text(body.input).trim(), 1000);
    summary = clip(text(body.summary).trim(), 500);
  }

  const pageUrl = text(body.pageUrl, 500);
  const lead: AgentLead = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    website: normalizeGateWebsite(input.website) || null,
    agent,
    input: agentInput,
    summary,
    pageUrl: /^https?:\/\//.test(pageUrl) ? pageUrl : null,
    isReturning: body.returning === true,
  };

  let saveError: string | undefined;
  try {
    await saveAgentLead(lead);
  } catch (error) {
    saveError = error instanceof Error ? error.message : String(error);
    // Last resort so the lead isn't lost: it's in the server log and the email.
    console.error("[agent-leads] save failed:", saveError, JSON.stringify(lead));
  }

  // Remembered visitors unlocking another agent are saved but not emailed again.
  if (!lead.isReturning || saveError) await notifyAgentLead(lead, saveError);

  // The visitor gets their report even if saving failed.
  return json({ ok: true, full });
}

export async function GET(request: Request) {
  if (!process.env.LEADS_ADMIN_KEY) return new Response("Not found", { status: 404 });
  if (!(await withinLimit(request, "leadsadmin", 60))) return new Response("Too many requests", { status: 429 });
  if (!isAdmin(request.headers.get("x-admin-key"))) {
    return Response.json({ error: "Wrong key" }, { status: 401 });
  }

  try {
    const leads = await listLeads();
    const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
    if (new URL(request.url).searchParams.get("format") === "csv") {
      return new Response(`﻿${leadsToCsv(leads)}`, {
        headers: {
          ...headers,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="jaseir-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return Response.json({ leads }, { headers });
  } catch (error) {
    console.error("[agent-leads] list failed:", error);
    return Response.json({ error: "Could not load leads." }, { status: 500 });
  }
}
