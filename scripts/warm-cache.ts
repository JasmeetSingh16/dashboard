/* ------------------------------------------------------------------ */
/* npm run rag:warm — pre-answer every preset question once            */
/* ------------------------------------------------------------------ */
/*
 * The starter chips, follow-ups and the auto-played question are served
 * from the answer cache, so visitors never trigger an AI call for them.
 * Run this after `npm run ingest` (new knowledge invalidates the cache).
 * Pauses between calls to stay under Groq's free 8K tokens/minute.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const PAUSE_MS = 20_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { PRESET_QUESTIONS, getCachedReply } = await import("../lib/rag/cache");
  const { runChat } = await import("../lib/rag/chat");

  let warmed = 0;
  let problems = 0;
  for (const question of PRESET_QUESTIONS) {
    if (await getCachedReply(question)) {
      console.log(`= cached   ${question}`);
      continue;
    }
    if (warmed > 0) await sleep(PAUSE_MS);

    let reply: { type: string; text: string } | null = null;
    for await (const event of runChat({ question, history: [] }, { ip: "cache-warmer", skipRateLimit: true })) {
      if (event.type === "done") reply = event.reply;
    }
    warmed++;
    if (reply?.type === "answer") console.log(`✓ warmed   ${question}`);
    else {
      problems++;
      console.log(`✗ NOT CACHED (handed off) ${question} — rephrase it or add the answer to /knowledge`);
    }
  }
  console.log(`\nDone. ${warmed} answered now, ${PRESET_QUESTIONS.length - warmed} already cached, ${problems} problem(s).`);
  process.exit(problems ? 1 : 0);
}

main();
