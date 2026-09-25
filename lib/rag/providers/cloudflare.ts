import "server-only";
import { requireEnv } from "../config";

/* ------------------------------------------------------------------ */
/* CLOUDFLARE WORKERS AI — REST client (free: 10,000 neurons/day)      */
/* ------------------------------------------------------------------ */
/*
 * POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/{model}
 * Retries up to 3 times with exponential backoff, but only for errors that
 * can succeed on retry (429 rate limit, 5xx, network). 4xx errors such as a
 * bad token fail immediately.
 */

const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class CloudflareAIError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function runModel<T>(model: string, body: unknown): Promise<T> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${requireEnv("CLOUDFLARE_ACCOUNT_ID")}/ai/run/${model}`;

  for (let attempt = 0; ; attempt++) {
    let status = 0;
    let detail = "";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${requireEnv("CLOUDFLARE_API_TOKEN")}`,
        },
        body: JSON.stringify(body),
      });
      status = response.status;

      if (response.ok) {
        const json = (await response.json()) as { success: boolean; result: T; errors?: { message: string }[] };
        if (json.success) return json.result;
        detail = json.errors?.map((e) => e.message).join("; ") ?? "unknown error";
      } else {
        detail = (await response.text()).slice(0, 300);
      }
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error); // network error → retryable
    }

    const retryable = status === 0 || status === 429 || status >= 500;
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new CloudflareAIError(`Workers AI ${model} failed (${status || "network"}): ${detail}`, status);
    }

    const delay = 1000 * 2 ** attempt + Math.random() * 250; // ~1s, 2s, 4s
    console.warn(`Workers AI ${model}: ${status || "network error"}, retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`);
    await sleep(delay);
  }
}
