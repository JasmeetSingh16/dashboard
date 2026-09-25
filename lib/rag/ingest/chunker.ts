import { CHUNKING } from "../config";

/* ------------------------------------------------------------------ */
/* CHUNKER — pure functions, no I/O                                    */
/* ------------------------------------------------------------------ */
/*
 * 1. Split a document into sections by headings (markdown) or pages (PDF).
 * 2. Split any section that is too long on paragraph, then sentence
 *    boundaries.
 * 3. Pack consecutive sections into chunks of ~minTokens–maxTokens.
 * 4. When a chunk continues the SAME section as the previous chunk (a long
 *    section that was split), start it with the last ~10% of the previous
 *    one, cut on a sentence boundary. Never overlap across headings —
 *    that would mix unrelated sections.
 */

/** Bump when chunking logic changes: forces a re-chunk + re-embed on the next ingest. */
export const CHUNKER_VERSION = 2; // v2: overlap only within the same section

export type Section = { heading: string; text: string; page?: number };

/** A piece of one section; `sectionIndex` says which section it came from. */
type Unit = Section & { sectionIndex: number };

export type Chunk = {
  index: number;
  content: string; // what is stored and shown to the LLM
  sectionHeading: string;
  page: number | null;
  tokenCount: number;
};

/** ~4 characters per token for English prose. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/** Markdown → sections. Keeps each heading line inside its section text. */
export function sectionsFromMarkdown(markdown: string, title: string): Section[] {
  const sections: Section[] = [];
  const stack: string[] = []; // heading path, e.g. ["Pricing", "Starter package"]
  let current: Section = { heading: title, text: "" };

  const clean = markdown.replace(/<!--[\s\S]*?-->/g, "");

  for (const line of clean.split("\n")) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      if (current.text.trim()) sections.push(current);
      const level = match[1].length;
      stack.length = level - 1;
      stack[level - 1] = match[2];
      // The H1 is the document title, so leave it out of deeper labels.
      const path = level === 1 ? [match[2]] : stack.slice(1).filter(Boolean);
      current = { heading: path.join(" › ") || title, text: `${line}\n` };
    } else {
      current.text += `${line}\n`;
    }
  }
  if (current.text.trim()) sections.push(current);

  // A section that is only its heading line adds nothing on its own.
  return sections
    .map((section) => ({ ...section, text: section.text.replace(/\n{3,}/g, "\n\n").trim() }))
    .filter((section) => section.text.split("\n").some((line) => line.trim() && !line.startsWith("#")));
}

/** PDF pages → sections (one per page). */
export function sectionsFromPages(pages: string[]): Section[] {
  return pages
    .map((text, i) => ({ heading: `Page ${i + 1}`, text: text.replace(/\s+\n/g, "\n").trim(), page: i + 1 }))
    .filter((section) => section.text);
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/** Splits one oversized section into pieces that each fit maxTokens. */
function splitLongSection(section: Section, maxTokens: number): Section[] {
  if (estimateTokens(section.text) <= maxTokens) return [section];

  const pieces: Section[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim()) pieces.push({ ...section, text: buffer.trim() });
    buffer = "";
  };

  for (const paragraph of section.text.split(/\n{2,}/)) {
    const units = estimateTokens(paragraph) > maxTokens ? splitSentences(paragraph) : [paragraph];
    for (const unit of units) {
      if (buffer && estimateTokens(`${buffer}\n\n${unit}`) > maxTokens) flush();
      buffer = buffer ? `${buffer}\n\n${unit}` : unit;
    }
  }
  flush();
  return pieces;
}

/** Last ~ratio of a chunk, cut on a sentence boundary. */
function overlapTail(text: string, targetTokens: number): string {
  const sentences = splitSentences(text.replace(/^#+\s.*$/gm, ""));
  const tail: string[] = [];
  let tokens = 0;
  for (let i = sentences.length - 1; i >= 0 && tokens < targetTokens; i--) {
    tail.unshift(sentences[i]);
    tokens += estimateTokens(sentences[i]);
  }
  // Never let the overlap be most of the new chunk.
  return tokens <= targetTokens * 2 ? tail.join(" ") : "";
}

type ChunkOptions = {
  strategy?: "pack" | "section";
  minTokens: number;
  maxTokens: number;
  overlapRatio: number;
};

export function chunkSections(sections: Section[], options: ChunkOptions = CHUNKING): Chunk[] {
  const { strategy = "pack", minTokens, maxTokens, overlapRatio } = options;
  const overlapTokens = Math.round(maxTokens * overlapRatio);
  // Leave room for the overlap that will be prepended.
  const budget = maxTokens - overlapTokens;
  const units: Unit[] = sections.flatMap((section, sectionIndex) =>
    splitLongSection(section, budget).map((piece) => ({ ...piece, sectionIndex }))
  );

  // Pack units into groups up to the budget.
  const groups: Unit[][] = [];
  let group: Unit[] = [];
  let groupTokens = 0;
  for (const unit of units) {
    const tokens = estimateTokens(unit.text);
    // "section" mode: start a new chunk at every section, unless the
    // current one is only a stub (e.g. a heading with one line).
    const newSection = strategy === "section" && groupTokens >= 40;
    if (group.length && (newSection || groupTokens + tokens > budget)) {
      groups.push(group);
      group = [];
      groupTokens = 0;
    }
    group.push(unit);
    groupTokens += tokens;
  }
  if (group.length) groups.push(group);

  // A tiny last group is merged back if it fits.
  if (strategy === "pack" && groups.length > 1) {
    const last = groups[groups.length - 1];
    const prev = groups[groups.length - 2];
    const size = (g: Section[]) => g.reduce((sum, s) => sum + estimateTokens(s.text), 0);
    if (size(last) < minTokens / 2 && size(prev) + size(last) <= maxTokens) {
      groups.splice(groups.length - 2, 2, [...prev, ...last]);
    }
  }

  const chunks: Chunk[] = [];
  let previousBody = "";
  groups.forEach((g, index) => {
    const body = g.map((s) => s.text).join("\n\n");
    // Overlap only when this chunk continues the section the previous one ended in.
    const continuesSection = index > 0 && groups[index - 1].at(-1)!.sectionIndex === g[0].sectionIndex;
    const overlap = continuesSection ? overlapTail(previousBody, overlapTokens) : "";
    const content = overlap ? `${overlap}\n\n${body}` : body;
    const headings = [...new Set(g.map((s) => s.heading))];

    chunks.push({
      index,
      content,
      sectionHeading: headings.join(" · "),
      page: g.find((s) => s.page)?.page ?? null,
      tokenCount: estimateTokens(content),
    });
    previousBody = body;
  });

  return chunks;
}

/** The text that is actually embedded: document + section context first. */
export const embeddingText = (title: string, chunk: Chunk) =>
  `Document: ${title} | Section: ${chunk.sectionHeading}\n\n${chunk.content}`;
