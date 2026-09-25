import "server-only";
import { EMBEDDING } from "../config";
import { runModel } from "./cloudflare";

/* ------------------------------------------------------------------ */
/* EMBEDDINGS ADAPTER                                                  */
/* ------------------------------------------------------------------ */
/*
 * The rest of the code only uses `embedPassages` / `embedQuery`. To switch
 * provider, add another adapter with the same shape, register it below,
 * change EMBEDDING in config.ts and re-run `npm run ingest` (documents
 * embedded with a different model are re-embedded automatically).
 */

export type EmbeddingResult = { vectors: number[][] };

export interface EmbeddingProvider {
  embed(texts: string[], kind: "passage" | "query"): Promise<EmbeddingResult>;
}

/*
 * Cloudflare Workers AI — @cf/baai/bge-m3 (multilingual, 1024 dims).
 * BGE-M3 needs no query/passage instruction, so `kind` is unused here.
 */
const cloudflare: EmbeddingProvider = {
  async embed(texts) {
    const result = await runModel<{ shape?: number[]; data: number[][] }>(EMBEDDING.model, { text: texts });
    return { vectors: result.data };
  },
};

const providers: Record<string, EmbeddingProvider> = { cloudflare };

async function embed(texts: string[], kind: "passage" | "query"): Promise<EmbeddingResult> {
  const provider = providers[EMBEDDING.provider];
  if (!provider) throw new Error(`Unknown embedding provider "${EMBEDDING.provider}"`);

  const result = await provider.embed(texts, kind);

  if (result.vectors.length !== texts.length) {
    throw new Error(`Expected ${texts.length} embeddings, got ${result.vectors.length}.`);
  }
  // Guard against silently mixing vector sizes in the database.
  for (const vector of result.vectors) {
    if (vector.length !== EMBEDDING.dimensions) {
      throw new Error(`Embedding has ${vector.length} dimensions but config expects ${EMBEDDING.dimensions}.`);
    }
  }
  return result;
}

export const embedPassages = (texts: string[]) => embed(texts, "passage");

export async function embedQuery(text: string): Promise<number[]> {
  const { vectors } = await embed([text], "query");
  return vectors[0];
}
