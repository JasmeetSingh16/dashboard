import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { CHUNKING, EMBEDDING } from "../config";
import { CHUNKER_VERSION, chunkSections, sectionsFromMarkdown, sectionsFromPages, type Chunk } from "./chunker";

/* ------------------------------------------------------------------ */
/* LOAD A KNOWLEDGE FILE → title, language, hash, chunks               */
/* ------------------------------------------------------------------ */

export const SUPPORTED_EXTENSIONS = [".md", ".markdown", ".txt", ".pdf"];

export type LoadedDocument = {
  path: string; // relative, e.g. knowledge/pricing.md
  title: string;
  type: "markdown" | "pdf" | "text";
  language: string;
  contentHash: string;
  chunks: Chunk[];
};

/** Minimal front matter: `---\ntitle: X\nlanguage: en\n---` at the top. */
function frontMatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  return { meta, body: raw.slice(match[0].length) };
}

const titleFromFilename = (file: string) =>
  path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function loadDocument(filePath: string, rootDir: string): Promise<LoadedDocument> {
  const relative = path.relative(rootDir, filePath).split(path.sep).join("/");
  const ext = path.extname(filePath).toLowerCase();
  const bytes = await readFile(filePath);

  // The hash covers the file AND the chunking settings + chunker version,
  // so changing either re-chunks everything on the next ingest.
  const contentHash = createHash("sha256")
    .update(bytes)
    .update(JSON.stringify(CHUNKING))
    .update(String(CHUNKER_VERSION))
    .update(EMBEDDING.model)
    .digest("hex");

  if (ext === ".pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    const title = titleFromFilename(filePath);
    return {
      path: relative,
      title,
      type: "pdf",
      language: "en",
      contentHash,
      chunks: chunkSections(sectionsFromPages(pages)),
    };
  }

  const { meta, body } = frontMatter(bytes.toString("utf8"));
  const h1 = /^#\s+(.+)$/m.exec(body)?.[1]?.trim();
  const title = meta.title || h1 || titleFromFilename(filePath);

  return {
    path: relative,
    title,
    type: ext === ".txt" ? "text" : "markdown",
    language: meta.language || "en",
    contentHash,
    chunks: chunkSections(sectionsFromMarkdown(body, title)),
  };
}
