import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
(async () => {
  const { redis } = await import("../lib/rag/redis");
  const { visitorKey } = await import("../lib/rag/rate-limit");
  const now = new Date();
  const keys = ["local", "::1", "127.0.0.1", "::ffff:127.0.0.1"].flatMap((ip) => {
    const v = visitorKey(ip);
    return [`rl:h:${v}:${now.toISOString().slice(0, 13)}`, `rl:d:${v}:${now.toISOString().slice(0, 10)}`];
  });
  const [deleted] = (await redis([["DEL", ...keys]])) as number[];
  console.log(`reset ${deleted} localhost rate-limit counters`);
})();
