-- ====================================================================
-- 0003 — "Get one for your business" lead form
-- Adds the form's columns to the existing public.leads table.
-- Safe to run more than once. Rows are written server-side with the
-- secret key only; RLS (tenant_isolation) stays enabled.
-- ====================================================================

alter table public.leads add column if not exists company      text;
alter table public.leads add column if not exists website      text;
alter table public.leads add column if not exists industry     text;
alter table public.leads add column if not exists source_page  text;
alter table public.leads add column if not exists consented_at timestamptz;

-- name, email, phone, message and created_at already exist (0001).

create index if not exists leads_tenant_created_idx on public.leads (tenant_id, created_at desc);
