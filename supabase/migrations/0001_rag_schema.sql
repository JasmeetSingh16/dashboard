-- ====================================================================
-- RAG knowledge assistant — schema (Phase 1)
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement is idempotent.
--
-- IMPORTANT: vector(1024) must match EMBEDDING.dimensions in
-- lib/rag/config.ts (Cloudflare Workers AI @cf/baai/bge-m3 = 1024).
-- ====================================================================

create extension if not exists vector with schema extensions;

-- --------------------------------------------------------------------
-- Tenants (one row per business using the assistant)
-- --------------------------------------------------------------------
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- Sources: where documents come from (a folder, an upload, a website…)
-- --------------------------------------------------------------------
create table if not exists public.sources (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  kind        text not null check (kind in ('folder', 'upload', 'url', 'drive')),
  name        text not null,
  uri         text,
  created_at  timestamptz not null default now(),
  unique (tenant_id, name)
);

-- --------------------------------------------------------------------
-- Documents: one row per file/page. content_hash lets ingestion skip
-- unchanged files; embedding_model forces a re-embed if the model changes.
-- --------------------------------------------------------------------
create table if not exists public.documents (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  source_id        uuid references public.sources (id) on delete set null,
  path             text not null,               -- e.g. knowledge/pricing.md
  title            text not null,
  type             text not null check (type in ('markdown', 'pdf', 'text', 'html')),
  content_hash     text not null,
  language         text not null default 'en',
  embedding_model  text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, path)
);

-- --------------------------------------------------------------------
-- Chunks: the retrievable passages
-- --------------------------------------------------------------------
create table if not exists public.chunks (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  document_id      uuid not null references public.documents (id) on delete cascade,
  chunk_index      int  not null,
  content          text not null,
  embedding        extensions.vector(1024) not null,
  page             int,
  section_heading  text,
  token_count      int,
  -- Full-text search column, kept up to date by Postgres itself.
  tsv              tsvector generated always as (
                     to_tsvector('english', coalesce(section_heading, '') || ' ' || content)
                   ) stored,
  created_at       timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists chunks_embedding_hnsw
  on public.chunks using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists chunks_tsv_gin    on public.chunks using gin (tsv);
create index if not exists chunks_tenant_idx on public.chunks (tenant_id);
create index if not exists chunks_doc_idx    on public.chunks (document_id);

-- --------------------------------------------------------------------
-- Conversations + messages (chat logs, for quality review)
-- --------------------------------------------------------------------
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  visitor_id  text,                              -- anonymous id, no PII
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants (id) on delete cascade,
  conversation_id     uuid not null references public.conversations (id) on delete cascade,
  role                text not null check (role in ('user', 'assistant')),
  content             text not null,
  rewritten_question  text,
  used_chunk_ids      uuid[] not null default '{}',
  model               text,
  prompt_tokens       int,
  completion_tokens   int,
  tokens              int,
  latency_ms          int,
  created_at          timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_tenant_idx       on public.messages (tenant_id, created_at);

-- --------------------------------------------------------------------
-- Leads + feedback
-- --------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  conversation_id  uuid references public.conversations (id) on delete set null,
  name             text,
  email            text,
  phone            text,
  message          text,
  created_at       timestamptz not null default now()
);

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  message_id  uuid not null references public.messages (id) on delete cascade,
  rating      smallint not null check (rating in (-1, 1)),
  comment     text,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- Row-level security by tenant_id
--
-- The server uses the service-role key (bypasses RLS) and always filters
-- by tenant_id in code. These policies make sure anyone using the public
-- anon/authenticated keys can only ever see rows of the tenant in their
-- JWT claim `tenant_id` — and without such a claim, nothing at all.
-- --------------------------------------------------------------------
alter table public.tenants       enable row level security;
alter table public.sources       enable row level security;
alter table public.documents     enable row level security;
alter table public.chunks        enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.leads         enable row level security;
alter table public.feedback      enable row level security;

drop policy if exists tenant_isolation on public.tenants;
create policy tenant_isolation on public.tenants
  for all using (id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid)
  with check (id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid);

do $$
declare
  t text;
begin
  foreach t in array array['sources', 'documents', 'chunks', 'conversations', 'messages', 'leads', 'feedback']
  loop
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format(
      'create policy tenant_isolation on public.%I for all
         using (tenant_id = nullif(auth.jwt() ->> ''tenant_id'', '''')::uuid)
         with check (tenant_id = nullif(auth.jwt() ->> ''tenant_id'', '''')::uuid)',
      t
    );
  end loop;
end $$;

-- --------------------------------------------------------------------
-- Seed: the Jaseir demo tenant
-- --------------------------------------------------------------------
insert into public.tenants (slug, name)
values ('jaseir', 'Jaseir')
on conflict (slug) do nothing;
