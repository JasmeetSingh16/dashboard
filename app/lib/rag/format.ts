/* ------------------------------------------------------------------ */
/* ANSWER TEXT FORMATTING — shared by the API and the chat UI          */
/* ------------------------------------------------------------------ */
/*
 * The model cites passages inline and ends replies it can't answer with a
 * HANDOFF marker. Visitors see neither: sources appear as chips instead,
 * and handoff as buttons.
 *
 * Accepted citation styles: [P1]  [P1, P3]  and gpt-oss's native
 * 【P1】  【P1†L2-L4】  【P1, P3】. Same for [HANDOFF] / 【HANDOFF】.
 */

const OPEN = "[\\[【]";
const CLOSE = "[\\]】]";
const REF = "P\\d+(?:†[^,;\\]】]*)?"; // P1 or P1†L2-L4
const CITATION = new RegExp(`\\s*${OPEN}\\s*${REF}(?:\\s*[,;]\\s*P?\\d+(?:†[^,;\\]】]*)?)*\\s*${CLOSE}`, "gi");
const CITATION_GROUP = new RegExp(`${OPEN}\\s*(${REF}(?:\\s*[,;]\\s*P?\\d+(?:†[^,;\\]】]*)?)*)\\s*${CLOSE}`, "gi");
const HANDOFF = new RegExp(`\\s*${OPEN}\\s*HANDOFF\\s*${CLOSE}\\s*`, "gi");
// While streaming, a marker can arrive half-written at the very end.
const PARTIAL_MARKER = new RegExp(
  `\\s*${OPEN}(?:\\s*(?:P\\d*(?:†[^\\]】]*)?(?:\\s*[,;]\\s*P?\\d*)*|H(?:A(?:N(?:D(?:O(?:F(?:F)?)?)?)?)?)?))?\\s*$`,
  "i"
);

/** Passage numbers cited in the text, in order of first use (1-based). */
export function citedPassages(text: string): number[] {
  const seen: number[] = [];
  for (const match of text.matchAll(CITATION_GROUP)) {
    for (const part of match[1].split(/[,;]/)) {
      const n = Number(part.replace(/†.*/, "").replace(/\D/g, "")); // drop "†L2-L4" before reading the number
      if (n && !seen.includes(n)) seen.push(n);
    }
  }
  return seen;
}

export const hasHandoffMarker = (text: string) => new RegExp(`${OPEN}\\s*HANDOFF\\s*${CLOSE}`, "i").test(text);

/** Removes citation + handoff markers for display. */
export function cleanAnswer(text: string, { streaming = false } = {}): string {
  let out = text.replace(CITATION, "").replace(HANDOFF, " ");
  if (streaming) out = out.replace(PARTIAL_MARKER, "");
  return out.replace(/[ \t]+([.,!?;:])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
}

/** Short display name for a knowledge file: knowledge/faq.md → "FAQ", pricing.md → "Pricing". */
export function docLabel(path: string): string {
  const base = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? path;
  const words = base.split(/[-_\s]+/).filter(Boolean);
  return words.map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ");
}
