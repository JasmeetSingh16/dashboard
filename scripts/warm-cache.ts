/* ------------------------------------------------------------------ */
/* npm run rag:warm — pre-answer every preset question once            */
/* ------------------------------------------------------------------ */
/*
 * The starter chips, follow-ups and the auto-played question are served
 * from the answer cache, so visitors never trigger an AI call for them.
 * Run this after `npm run ingest` (new knowledge invalidates the cache).
 * Same flags as ingest: `-- --tenant saas` or `-- --all` (default: jaseir).
 * Pauses between calls to stay under Groq's free 8K tokens/minute.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const PAUSE_MS = 20_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { tenantsFromArgs } = await import("./tenant-args");
  const { presetQuestionsFor, getCachedReply } = await import("../lib/rag/cache");
  const { runChat } = await import("../lib/rag/chat");

  let warmed = 0;
  let cached = 0;
  let problems = 0;
  for (const tenant of tenantsFromArgs(process.argv.slice(2))) {
    console.log(`\n━━ tenant: ${tenant} ━━`);
    for (const question of presetQuestionsFor(tenant)) {
      if (await getCachedReply(tenant, question)) {
        cached++;
        console.log(`= cached   ${question}`);
        continue;
      }
      if (warmed > 0) await sleep(PAUSE_MS);

      let reply: { type: string; text: string } | null = null;
      for await (const event of runChat({ question, history: [], tenant }, { ip: "cache-warmer", skipRateLimit: true })) {
        if (event.type === "done") reply = event.reply;
      }
      warmed++;
      if (reply?.type === "answer") console.log(`✓ warmed   ${question}`);
      else {
        problems++;
        console.log(`✗ NOT CACHED (handed off) ${question} — rephrase it or add the answer to the knowledge files`);
      }
    }
  }
  console.log(`\nDone. ${warmed} answered now, ${cached} already cached, ${problems} problem(s).`);
  process.exit(problems ? 1 : 0);
}

main();
