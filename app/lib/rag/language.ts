/* ------------------------------------------------------------------ */
/* Tiny language guesser for the "Replied in {language}" badge         */
/* ------------------------------------------------------------------ */
/*
 * Script detection for non-Latin languages, plus common-word counts for
 * the main Latin-script ones. Returns null for English or when unsure —
 * the badge only appears when we're reasonably confident.
 */

const SCRIPTS: [RegExp, string][] = [
  [/[ऀ-ॿ]/, "Hindi"],
  [/[਀-੿]/, "Punjabi"],
  [/[؀-ۿ]/, "Arabic"],
  [/[぀-ヿ]/, "Japanese"],
  [/[가-힯]/, "Korean"],
  [/[一-鿿]/, "Chinese"],
  [/[Ѐ-ӿ]/, "Russian"],
  [/[Ͱ-Ͽ]/, "Greek"],
];

const WORDS: Record<string, string[]> = {
  English: ["the", "and", "is", "are", "you", "your", "with", "for", "that", "can", "it", "of"],
  Spanish: ["el", "la", "los", "las", "es", "y", "que", "con", "para", "por", "una", "puede", "sus", "tu"],
  French: ["le", "la", "les", "est", "et", "des", "une", "pour", "avec", "vous", "votre", "peut", "sur"],
  German: ["der", "die", "das", "und", "ist", "mit", "für", "sie", "ihre", "eine", "nicht", "kann"],
  Portuguese: ["o", "os", "as", "é", "e", "que", "com", "para", "uma", "seu", "sua", "pode", "não"],
  Italian: ["il", "lo", "gli", "è", "e", "che", "con", "per", "una", "sono", "può", "suo"],
  Dutch: ["de", "het", "een", "en", "is", "met", "voor", "van", "je", "uw", "niet", "kan"],
};

export function detectLanguage(text: string): string | null {
  for (const [pattern, name] of SCRIPTS) if (pattern.test(text)) return name;

  const tokens = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (tokens.length < 4) return null;

  let best = "English";
  let bestScore = 0;
  for (const [language, words] of Object.entries(WORDS)) {
    const set = new Set(words);
    const score = tokens.filter((t) => set.has(t)).length;
    if (score > bestScore) {
      best = language;
      bestScore = score;
    }
  }
  return best !== "English" && bestScore >= 2 ? best : null;
}
