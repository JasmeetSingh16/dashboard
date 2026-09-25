-- ====================================================================
-- RAG knowledge assistant — search functions (Phase 2)
-- Run after 0001. Safe to re-run.
--
-- Two candidate generators; lib/rag/retrieve.ts merges them with
-- reciprocal rank fusion. Both ALWAYS filter by tenant.
-- search_path is pinned so the pgvector operators (in the `extensions`
-- schema) resolve no matter who calls the function.
-- ====================================================================

-- Semantic search: cosine similarity on the HNSW index.
create or replace function public.match_chunks_vector(
  p_tenant_id uuid,
  p_embedding extensions.vector(1024),
  p_count int default 20
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  path text,
  section_heading text,
  page int,
  content text,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.document_id, d.title, d.path, c.section_heading, c.page, c.content,
         1 - (c.embedding <=> p_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  where c.tenant_id = p_tenant_id
  order by c.embedding <=> p_embedding
  limit p_count;
$$;

-- Keyword search: Postgres full-text search on the GIN index.
-- Words are OR-ed (not AND-ed) so a natural question like
-- "how long does setup take" still matches chunks about "setup".
create or replace function public.match_chunks_fts(
  p_tenant_id uuid,
  p_query text,
  p_count int default 20
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  path text,
  section_heading text,
  page int,
  content text,
  rank float
)
language sql stable
set search_path = public, extensions
as $$
  with q as (
    select nullif(replace(plainto_tsquery('english', p_query)::text, '&', '|'), '') as text_query
  )
  select c.id, c.document_id, d.title, d.path, c.section_heading, c.page, c.content,
         ts_rank_cd(c.tsv, to_tsquery('english', q.text_query)) as rank
  from chunks c
  join documents d on d.id = c.document_id
  cross join q
  where c.tenant_id = p_tenant_id
    and q.text_query is not null
    and c.tsv @@ to_tsquery('english', q.text_query)
  order by rank desc
  limit p_count;
$$;

-- Only the server (secret key → service_role) may call these directly.
revoke execute on function public.match_chunks_vector(uuid, extensions.vector, int) from public, anon, authenticated;
revoke execute on function public.match_chunks_fts(uuid, text, int) from public, anon, authenticated;
grant execute on function public.match_chunks_vector(uuid, extensions.vector, int) to service_role;
grant execute on function public.match_chunks_fts(uuid, text, int) to service_role;
