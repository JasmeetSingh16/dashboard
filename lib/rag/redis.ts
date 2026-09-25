import "server-only";

/* ------------------------------------------------------------------ */
/* UPSTASH REDIS over REST (free: 256 MB, 500K commands/month)         */
/* ------------------------------------------------------------------ */
/*
 * No SDK: POST a 2D JSON array of commands to /multi-exec (atomic).
 * If UPSTASH_REDIS_REST_URL / _TOKEN are missing, falls back to an
 * in-memory store — fine for local development or a single self-hosted
 * process, but limits reset on restart and aren't shared between servers.
 */

type Command = (string | number)[];

const memory = new Map<string, { value: string; expiresAt: number }>();
let warned = false;

function memoryExec(commands: Command[]): unknown[] {
  const now = Date.now();
  const get = (key: string) => {
    const entry = memory.get(key);
    if (entry && entry.expiresAt <= now) memory.delete(key);
    return memory.get(key);
  };

  return commands.map(([name, key, ...args]) => {
    const k = String(key);
    switch (String(name).toUpperCase()) {
      case "GET":
        return get(k)?.value ?? null;
      case "SET": {
        // SET key value [EX seconds]
        const [value, option, seconds] = args;
        const ttl = String(option ?? "").toUpperCase() === "EX" ? Number(seconds) : 0;
        memory.set(k, { value: String(value ?? ""), expiresAt: ttl ? now + ttl * 1000 : Infinity });
        return "OK";
      }
      case "INCR": {
        const entry = get(k);
        const value = Number(entry?.value ?? 0) + 1;
        memory.set(k, { value: String(value), expiresAt: entry?.expiresAt ?? Infinity });
        return value;
      }
      case "EXPIRE": {
        const entry = get(k);
        if (!entry) return 0;
        entry.expiresAt = now + Number(args[0]) * 1000;
        return 1;
      }
      default:
        throw new Error(`memory redis: unsupported command ${name}`);
    }
  });
}

export const redisConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/** Runs commands atomically; returns each command's result. */
export async function redis(commands: Command[]): Promise<unknown[]> {
  if (!redisConfigured()) {
    if (!warned) {
      console.warn("[rag] Upstash not configured — using in-memory rate limits/cache (single process only).");
      warned = true;
    }
    return memoryExec(commands);
  }

  const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/multi-exec`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash ${response.status}: ${(await response.text()).slice(0, 200)}`);

  const results = (await response.json()) as { result?: unknown; error?: string }[];
  return results.map((r) => {
    if (r.error) throw new Error(`Upstash: ${r.error}`);
    return r.result;
  });
}
