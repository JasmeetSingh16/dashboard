# RAG backend — setup guide

The demo chat on `/rag-knowledge-assistant/` is backed by a retrieval-augmented
generation (RAG) pipeline built **only on free tiers** — no credit card needed.

| Part | Service | Free tier (checked Sept 2026) |
|---|---|---|
| Database + vectors + full-text search | Supabase (Postgres + pgvector) | 500 MB database, 2 active projects, 5 GB egress. **Projects pause after 1 week of inactivity** — open the dashboard and click *Restore* if that happens. |
| Embeddings | Cloudflare Workers AI `@cf/baai/bge-m3` (1024 dims, multilingual) | 10,000 neurons/day. bge-m3 = 1,075 neurons per 1M input tokens (≈ 9M tokens/day). Over the limit, calls fail — you are never charged on the free plan. |
| Reranker (optional, off by default) | Cloudflare Workers AI `@cf/baai/bge-reranker-base` | Same daily neurons; 283 neurons per 1M tokens. |
| PDF parsing | `unpdf` (open source, MIT) | — |
| Answers + follow-up rewriting | Groq — `openai/gpt-oss-120b` (answers), `openai/gpt-oss-20b` (rewrites), `reasoning_effort: "low"`, reasoning never returned | Free plan, per model: 30 requests/min, 1,000/day, **8,000 tokens/min**, 200,000 tokens/day. (Groq retired the Llama 3.x models on 2026-08-16.) |
| Fallback LLM (when Groq fails / returns 429) | Google Gemini `gemini-3.5-flash` | Free tier. **On the free tier Google may use prompts to improve its products** — fine for Jaseir's public demo content only; the demo disclaimer says so. |
| Rate limiting + answer cache | Upstash Redis (REST, no SDK) | 256 MB, 500K commands/month. Don't add a card — that upgrades the database to pay-as-you-go. |

Everything runs from this Next.js app plus one local script — no background
job services — so you can self-host it anywhere that runs Node.js.

---

## 1. Supabase (database)

1. Sign up at [supabase.com](https://supabase.com) and create a **new project**
   (Free plan). Pick the region closest to your visitors (EU or US).
2. **Project Settings → API Keys**. Copy:
   - the **Project URL** → `SUPABASE_URL`
   - the **publishable** key → `SUPABASE_PUBLISHABLE_KEY` (browser-safe; not used by the RAG server)
   - the **secret** key → `SUPABASE_SECRET_KEY` (server-only — it bypasses row-level security)
3. **SQL Editor → New query**. Paste and run, in order:
   1. `supabase/migrations/0001_rag_schema.sql` — tables, indexes, row-level security, seeds the `jaseir` tenant
   2. `supabase/migrations/0002_rag_search.sql` — the vector + full-text search functions

   Both files are safe to run again.

## 2. Cloudflare Workers AI (embeddings + reranker)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (Free plan).
2. **Account ID**: shown in the right-hand sidebar of the dashboard (e.g. on
   the *Workers AI* page) → `CLOUDFLARE_ACCOUNT_ID`.
3. **API token**: *My Profile → API Tokens → Create Token →* use the
   **Workers AI** template (Workers AI: Read + Edit) → `CLOUDFLARE_API_TOKEN`.

## 3. Groq, Gemini and Upstash (answers + limits)

1. **Groq** — [console.groq.com](https://console.groq.com) → *API Keys* → create → `GROQ_API_KEY`.
2. **Gemini** — [aistudio.google.com](https://aistudio.google.com) → *Get API key* → `GEMINI_API_KEY`.
3. **Upstash** — [console.upstash.com](https://console.upstash.com) → *Create database* (Redis, free) →
   *REST API* section → `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Without Upstash the app still works, using in-memory limits/cache (single process, resets on restart).

## 4. Local environment

```bash
cp .env.example .env.local   # then fill in the values
```

`.env.local` is gitignored. None of the server keys use the `NEXT_PUBLIC_`
prefix, so they never reach the browser. Check everything with:

```bash
npm run rag:check
```

It makes one tiny call per service (Supabase, Cloudflare embeddings + reranker, Groq ×2, Gemini,
Upstash) and prints PASS/FAIL (never the keys).

## 5. Knowledge → database (ingestion)

Edit the markdown files in `/knowledge` (PDFs and `.txt` also work). Optional
front matter at the top of a markdown file:

```md
---
title: Pricing and Packages
language: en
---
```

Then:

```bash
npm run ingest:dry   # shows the chunks; no API calls, no DB writes
npm run ingest       # embeds + saves
npm run rag:warm     # pre-answers the preset chat questions (run after every ingest)
```

`rag:warm` answers the auto-played question, starter chips and follow-ups once and caches
them, so visitors clicking them never trigger an AI call. It warns if a preset question
can't be answered from the knowledge base.

- Files are split by headings into chunks (`CHUNKING` in `lib/rag/config.ts`;
  default strategy `"section"` = one chunk per heading section).
- Each chunk is embedded as `Document: <title> | Section: <heading>` + text.
- **Unchanged files are skipped** (content hash). Re-running is safe and cheap.
- Deleted files are removed from the database.
- Each API call is retried at most 3 times; the run is one pass, it never loops.

Changing the embedding model: edit `EMBEDDING` in `lib/rag/config.ts` **and**
the `vector(1024)` size in both migrations if the dimensions change, then run
`npm run ingest` — documents embedded with another model are re-embedded
automatically.

## 6. Test retrieval

```bash
npm run dev
```

Open `http://localhost:3000/rag-debug`. Type a question to see the top 5
chunks with their vector similarity, keyword score, fused (RRF) score and
optional rerank score. The page returns 404 in production.

## 7. How the chat answers (POST /api/rag/chat/)

1. **Cache** — the preset demo questions (auto-played question, suggestions, follow-ups) are cached for 24 h
   and invalidated automatically by `npm run ingest`. Cache hits make no LLM call and don't count
   toward the visitor's limit.
2. **Rate limit** — per visitor (hashed IP): 10 messages/day and 20/hour (`LIMITS` in `lib/rag/config.ts`).
   Over the limit: a friendly message + *Book a call*.
3. **Rewrite** — follow-ups are turned into standalone questions with `gpt-oss-20b`, only when there is
   chat history (the first question never makes this call).
4. **Retrieve** — hybrid search; if the best similarity is below `RAG_MIN_CONFIDENCE` (0.50) the visitor
   gets the handoff message + booking + WhatsApp links, **without any LLM call**.
5. **Answer** — `gpt-oss-120b`, streamed, max ~600 output tokens, passages capped at 1,000 characters
   each (≈ 2–2.5K tokens per request, so a few answers per minute fit in Groq's 8K tokens/min). If Groq
   fails (429, error, bad key) → `gemini-3.5-flash` (one retry); if both fail → handoff message.
6. **Citations** — the model cites passages (`[P1]` or gpt-oss's `【P1】`); they become the green source
   chips and light up the matching file card in the hero. Replies that can't be answered from the
   passages end in a handoff with booking + WhatsApp buttons.
7. **Logging** — every exchange is stored in `messages` (question, rewritten question, chunks used,
   model, tokens, latency).

Other endpoints used by the chat panel: `GET /api/rag/sources/` (documents + passage counts for
the source cards) and `POST /api/rag/feedback/` (👍/👎, saved to `feedback`; only accepted for
the visitor's own messages).

Links for the handoff buttons live in `app/data/site-config.ts` (`BOOKING_URL`, `WHATSAPP_NUMBER`).
Set `NEXT_PUBLIC_RAG_MODE=local` to fall back to the offline keyword demo (no keys needed).

**Self-hosting:** any Node.js host works (`npm run build && npm start`). If you run behind nginx,
the API already sends `X-Accel-Buffering: no` so streaming isn't buffered; make sure the proxy
forwards `X-Forwarded-For` so rate limits are per visitor, not per proxy.

## 8. Security notes

- Keys live only in `.env.local` (and later your host's environment settings).
- If a key is ever pasted somewhere public (chat, screenshot, commit), rotate it:
  Supabase → *API Keys* → create a new secret key and delete the old one;
  Cloudflare → *API Tokens* → *Roll*.
- The server always filters by `tenant_id`; row-level security blocks the
  public keys from reading any tenant's data directly.

---

*Phase 4 (evaluation) will extend this guide.*
