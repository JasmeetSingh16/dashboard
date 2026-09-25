import type {
  AssistantReply,
  KnowledgeAssistant,
  KnowledgeBase,
  KnowledgeChunk,
} from "./types";

/* ------------------------------------------------------------------ */
/* LOCAL KEYWORD RETRIEVER (demo only)                                 */
/* ------------------------------------------------------------------ */
/*
 * Scores every chunk by keyword overlap with the question, weighted by
 * how rare each word is across the knowledge base (IDF). Title and
 * keyword hits count double. If the best chunk covers too little of the
 * question, the assistant falls back to a human handoff.
 */

const STOP_WORDS = new Set(
  (
    "a an and are as at be by can do does for from get give has have how i if in into is it its " +
    "me my of on or our so that the their them then there these this to us was we what when where " +
    "which who why will with you your yours about any also am just need want tell please much " +
    "hai hain ka ki ke ko kya ho se mein me main aap tum bhi na nahi hoga hota karta karte " +
    "kaun wala wali kar karo karna sakte sakta sakti milega milta chahiye"
  ).split(" ")
);

const MIN_CONFIDENCE = 0.34;

export const FALLBACK_TEXT =
  "I don't have that in my knowledge base yet. Want me to connect you with the Jaseir team?";

type IndexedChunk = {
  chunk: KnowledgeChunk;
  strong: Set<string>;
  body: Set<string>;
};

function buildNormalizer(synonyms: Record<string, string[]> = {}) {
  const canonical = new Map<string, string>();

  for (const [word, variants] of Object.entries(synonyms)) {
    for (const variant of variants) canonical.set(variant.toLowerCase(), word);
  }

  const stem = (word: string) => {
    if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  };

  return (text: string) =>
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word && !STOP_WORDS.has(word))
      .map((word) => canonical.get(word) ?? canonical.get(stem(word)) ?? stem(word));
}

function bestSentence(text: string, terms: Set<string>, normalize: (t: string) => string[]) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  let best = sentences[0];
  let bestHits = -1;

  for (const sentence of sentences) {
    const hits = normalize(sentence).filter((token) => terms.has(token)).length;
    if (hits > bestHits) {
      best = sentence;
      bestHits = hits;
    }
  }

  return best.trim();
}

export function createLocalAssistant(
  knowledgeBase: KnowledgeBase,
  { handoffUrl, delayMs = 650 }: { handoffUrl: string; delayMs?: number }
): KnowledgeAssistant {
  const normalize = buildNormalizer(knowledgeBase.synonyms);

  const index: IndexedChunk[] = knowledgeBase.chunks.map((chunk) => ({
    chunk,
    strong: new Set(normalize([chunk.title, ...(chunk.keywords ?? [])].join(" "))),
    body: new Set(normalize(chunk.text)),
  }));

  const documentFrequency = new Map<string, number>();
  for (const { strong, body } of index) {
    for (const token of new Set([...strong, ...body])) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const weakWords = new Set(normalize((knowledgeBase.weakWords ?? []).join(" ")));

  const weight = (token: string) =>
    Math.log(1 + index.length / (documentFrequency.get(token) ?? 0.5)) *
    (weakWords.has(token) ? 0.25 : 1);

  const score = (item: IndexedChunk, terms: Iterable<string>) => {
    let total = 0;
    for (const term of terms) {
      if (item.strong.has(term)) total += 2 * weight(term);
      else if (item.body.has(term)) total += weight(term);
    }
    return total;
  };

  const toSource = (chunk: KnowledgeChunk, terms: Set<string>) => ({
    id: chunk.id,
    title: chunk.title,
    source: chunk.source,
    sourceType: chunk.sourceType,
    highlight: bestSentence(chunk.text, terms, normalize),
  });

  const retrieve = (question: string): AssistantReply => {
    const terms = new Set(normalize(question));
    const fallback: AssistantReply = { type: "fallback", text: FALLBACK_TEXT, handoffUrl };

    if (terms.size === 0) return fallback;

    const maxScore = [...terms].reduce((sum, term) => sum + 2 * weight(term), 0);

    const ranked = index
      .map((item) => ({ item, score: score(item, terms) }))
      .sort((a, b) => b.score - a.score);

    const [best] = ranked;
    const confidence = best.score / maxScore;

    if (confidence < MIN_CONFIDENCE) return fallback;

    // If part of the question is only covered by another chunk
    // (e.g. "WhatsApp" + "Hindi"), answer from that chunk too.
    const uncovered = [...terms].filter(
      (term) => !best.item.strong.has(term) && !best.item.body.has(term) && !weakWords.has(term)
    );
    const second = uncovered.length
      ? index
          .filter((item) => item !== best.item)
          .map((item) => ({ item, score: score(item, uncovered) }))
          .sort((a, b) => b.score - a.score)[0]
      : undefined;
    const chunks =
      second && second.score >= best.score * 0.5
        ? [best.item.chunk, second.item.chunk]
        : [best.item.chunk];

    return {
      type: "answer",
      text: chunks.map((chunk) => chunk.text).join(" "),
      confidence: Math.min(1, confidence),
      sources: chunks.map((chunk) => toSource(chunk, terms)),
    };
  };

  return {
    async ask(question, { signal } = {}) {
      // A short pause so the "searching" state is visible, like a real backend.
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delayMs);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

      return retrieve(question);
    },
  };
}
