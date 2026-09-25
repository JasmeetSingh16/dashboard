/* ------------------------------------------------------------------ */
/* npm run ingest  — /knowledge → chunks → embeddings → Supabase       */
/* ------------------------------------------------------------------ */
/*
 * Flags:
 *   --dry-run   parse + chunk only; prints the chunks, no API/DB calls
 *   --force     re-embed every document even if unchanged
 *
 * Per document: if the content hash and embedding model are unchanged it
 * is skipped, so re-running never re-embeds unchanged files. The run is a
 * single pass over the files (no watching, no loops); each API call is
 * retried at most 3 times. Otherwise it is embedded FIRST (so an API failure changes
 * nothing), then its old chunks are replaced. Documents whose files were
 * removed from /knowledge are deleted (their chunks cascade).
 */
import { loadEnvConfig } from "@next/env";
import { readdir } from "node:fs/promises";
import path from "node:path";

loadEnvConfig(process.cwd()); // reads .env.local like Next.js does

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

async function main() {
  // Imported after env is loaded.
  const { EMBEDDING, RAG } = await import("../lib/rag/config");
  const { embeddingText } = await import("../lib/rag/ingest/chunker");
  const { loadDocument, SUPPORTED_EXTENSIONS } = await import("../lib/rag/ingest/load");

  const root = process.cwd();
  const dir = path.join(root, RAG.knowledgeDir);
  const files = (await readdir(dir))
    .filter((file) => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .sort()
    .map((file) => path.join(dir, file));

  const docs = await Promise.all(files.map((file) => loadDocument(file, root)));

  if (DRY_RUN) {
    for (const doc of docs) {
      console.log(`\n■ ${doc.path} — "${doc.title}" (${doc.chunks.length} chunks)`);
      for (const chunk of doc.chunks) {
        const preview = chunk.content.replace(/\s+/g, " ").slice(0, 90);
        console.log(`  #${chunk.index} ~${chunk.tokenCount} tok | ${chunk.sectionHeading}\n     ${preview}…`);
      }
    }
    const total = docs.reduce((sum, d) => sum + d.chunks.length, 0);
    console.log(`\nDry run: ${docs.length} documents, ${total} chunks. Nothing was embedded or saved.`);
    return;
  }

  const { db, tenantId } = await import("../lib/rag/db");
  const { embedPassages } = await import("../lib/rag/providers/embeddings");

  const tenant = await tenantId();
  const supabase = db();

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .upsert(
      { tenant_id: tenant, kind: "folder", name: RAG.knowledgeDir, uri: `${RAG.knowledgeDir}/` },
      { onConflict: "tenant_id,name" }
    )
    .select("id")
    .single();
  if (sourceError || !source) throw new Error(`Could not create source: ${sourceError?.message}`);

  const { data: existing, error: existingError } = await supabase
    .from("documents")
    .select("id, path, content_hash, embedding_model")
    .eq("tenant_id", tenant)
    .eq("source_id", source.id);
  if (existingError) throw new Error(existingError.message);

  const byPath = new Map((existing ?? []).map((row) => [row.path as string, row]));
  const stats = { embedded: 0, skipped: 0, removed: 0, chunks: 0, apiCalls: 0 };

  for (const doc of docs) {
    const previous = byPath.get(doc.path);
    if (
      !FORCE &&
      previous &&
      previous.content_hash === doc.contentHash &&
      previous.embedding_model === EMBEDDING.model
    ) {
      stats.skipped++;
      console.log(`= ${doc.path} unchanged, skipped`);
      continue;
    }

    // 1) Embed (in batches) before touching the database.
    const texts = doc.chunks.map((chunk) => embeddingText(doc.title, chunk));
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBEDDING.batchSize) {
      const { vectors: batch } = await embedPassages(texts.slice(i, i + EMBEDDING.batchSize));
      vectors.push(...batch);
      stats.apiCalls++;
    }

    // 2) Upsert the document, marked "pending" until its chunks are saved.
    const { data: saved, error: docError } = await supabase
      .from("documents")
      .upsert(
        {
          tenant_id: tenant,
          source_id: source.id,
          path: doc.path,
          title: doc.title,
          type: doc.type,
          language: doc.language,
          content_hash: "pending",
          embedding_model: EMBEDDING.model,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,path" }
      )
      .select("id")
      .single();
    if (docError || !saved) throw new Error(`Saving ${doc.path} failed: ${docError?.message}`);

    // 3) Replace its chunks.
    const { error: deleteError } = await supabase
      .from("chunks")
      .delete()
      .eq("tenant_id", tenant)
      .eq("document_id", saved.id);
    if (deleteError) throw new Error(deleteError.message);

    const rows = doc.chunks.map((chunk, i) => ({
      tenant_id: tenant,
      document_id: saved.id,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: vectors[i],
      page: chunk.page,
      section_heading: chunk.sectionHeading,
      token_count: chunk.tokenCount,
    }));
    for (let i = 0; i < rows.length; i += 50) {
      const { error } = await supabase.from("chunks").insert(rows.slice(i, i + 50));
      if (error) throw new Error(`Inserting chunks for ${doc.path} failed: ${error.message}`);
    }

    // 4) Only now record the real hash, so a crash mid-way is retried next run.
    const { error: hashError } = await supabase
      .from("documents")
      .update({ content_hash: doc.contentHash })
      .eq("id", saved.id)
      .eq("tenant_id", tenant);
    if (hashError) throw new Error(hashError.message);

    stats.embedded++;
    stats.chunks += rows.length;
    console.log(`✓ ${doc.path} → ${rows.length} chunks embedded`);
  }

  // Remove documents whose files no longer exist.
  const current = new Set(docs.map((doc) => doc.path));
  for (const row of existing ?? []) {
    if (current.has(row.path)) continue;
    const { error } = await supabase.from("documents").delete().eq("id", row.id).eq("tenant_id", tenant);
    if (error) throw new Error(error.message);
    stats.removed++;
    console.log(`✗ ${row.path} removed (file deleted)`);
  }

  console.log(
    `\nDone. Embedded ${stats.embedded}, skipped ${stats.skipped}, removed ${stats.removed} documents; ` +
      `${stats.chunks} chunks embedded in ${stats.apiCalls} API calls (${EMBEDDING.model}).`
  );
}

main().catch((error) => {
  console.error(`\nIngest failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
