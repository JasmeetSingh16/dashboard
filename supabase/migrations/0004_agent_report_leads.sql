-- ====================================================================
-- 0004 — Leads from the "Get your full report" form on the free agents
-- (SEO Planner, Content Planner, Conversion Friction Analyzer,
-- Competitor Comparison, Lead Qualification).
-- Same public.leads table as the demo request form, so every lead is in
-- one place. Safe to run more than once. Rows are written server-side
-- with the secret key only; RLS (tenant_isolation) stays enabled.
-- Needs 0003 (website, source_page, consented_at).
-- ====================================================================

-- 'demo_form' (RAG "Get one for your business") or 'agent_report'.
alter table public.leads add column if not exists source         text;
-- Agent slug from lib/agents.ts, e.g. 'seo-planner'.
alter table public.leads add column if not exists agent          text;
-- What the visitor gave the agent (e.g. the URL they analysed).
alter table public.leads add column if not exists agent_input    text;
-- Short summary of their result (score + headline).
alter table public.leads add column if not exists result_summary text;
-- Full page URL the form was submitted from.
alter table public.leads add column if not exists page_url       text;
-- True when a remembered visitor unlocked another report automatically.
alter table public.leads add column if not exists is_returning   boolean not null default false;

create index if not exists leads_tenant_email_idx on public.leads (tenant_id, email);
