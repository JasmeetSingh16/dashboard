import "server-only";
import { createHash } from "node:crypto";
import { LIMITS } from "./config";
import { redis } from "./redis";

/* ------------------------------------------------------------------ */
/* PER-VISITOR RATE LIMIT (fixed windows: this hour + this UTC day)    */
/* ------------------------------------------------------------------ */
/*
 * The visitor key is a hash of the client IP, so no raw IP is stored.
 * Each window's counter expires on its own, so keys never pile up.
 */

export type RateLimitResult = { allowed: boolean; remainingToday: number; window?: "hour" | "day" };

export function visitorKey(ip: string): string {
  const salt = process.env.SUPABASE_URL ?? "jaseir"; // stable per deployment, not secret-critical
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Limits are counted per tenant (each demo business has its own allowance). */
export async function checkRateLimit(visitor: string, tenant: string): Promise<RateLimitResult> {
  const now = new Date();
  const hourKey = `rl:h:${tenant}:${visitor}:${now.toISOString().slice(0, 13)}`; // e.g. …:2026-09-25T14
  const dayKey = `rl:d:${tenant}:${visitor}:${now.toISOString().slice(0, 10)}`; // e.g. …:2026-09-25

  const [hourCount, , dayCount] = (await redis([
    ["INCR", hourKey],
    ["EXPIRE", hourKey, 60 * 60],
    ["INCR", dayKey],
    ["EXPIRE", dayKey, 60 * 60 * 24],
  ])) as number[];

  const remainingToday = Math.max(0, LIMITS.perDay - dayCount);
  if (dayCount > LIMITS.perDay) return { allowed: false, remainingToday, window: "day" };
  if (hourCount > LIMITS.perHour) return { allowed: false, remainingToday, window: "hour" };
  return { allowed: true, remainingToday };
}
