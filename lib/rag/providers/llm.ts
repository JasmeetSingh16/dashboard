import "server-only";
import { requireEnv } from "../config";

/* ------------------------------------------------------------------ */
/* LLM ADAPTER                                                         */
/* ------------------------------------------------------------------ */
/*
 * Two free providers behind one interface:
 *   groq   — OpenAI-compatible chat completions (gpt-oss models)
 *   gemini — Google Generative Language API (streamGenerateContent, SSE)
 * Reasoning/"thought" text is never returned by either adapter.
 * To add a provider, implement LLMProvider and register it in `providers`.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type LLMUsage = { promptTokens: number; completionTokens: number };

export type LLMRequest = {
  model: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  temperature: number;
  reasoningEffort?: "low" | "medium" | "high";
};

export interface LLMProvider {
  /** Yields text deltas; returns token usage when the stream ends. */
  stream(request: LLMRequest, signal?: AbortSignal): AsyncGenerator<string, LLMUsage>;
  complete(request: LLMRequest, signal?: AbortSignal): Promise<{ text: string; usage: LLMUsage }>;
}

/** status 0 = network error. 429 and 5xx are worth falling back on. */
export class LLMError extends Error {
  constructor(message: string, readonly status: number, readonly provider: string) {
    super(message);
  }
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

/** Parses a server-sent-events body into the JSON payload of each `data:` line. */
async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        // ignore keep-alives / partial garbage
      }
    }
    if (done) return;
  }
}

async function post(provider: string, url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LLMError(`${provider} network error: ${error instanceof Error ? error.message : error}`, 0, provider);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new LLMError(`${provider} ${response.status}: ${detail}`, response.status, provider);
  }
  return response;
}

/* ---------------------------- Groq ---------------------------------- */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqChunk = {
  choices?: { delta?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  x_groq?: { usage?: { prompt_tokens?: number; completion_tokens?: number } };
};

function groqBody(request: LLMRequest, stream: boolean) {
  return {
    model: request.model,
    messages: request.messages,
    max_completion_tokens: request.maxOutputTokens,
    temperature: request.temperature,
    stream,
    ...(request.reasoningEffort && {
      reasoning_effort: request.reasoningEffort,
      include_reasoning: false, // gpt-oss: never return reasoning text
    }),
  };
}

const groqHeaders = () => ({ Authorization: `Bearer ${requireEnv("GROQ_API_KEY")}` });

const groq: LLMProvider = {
  async *stream(request, signal) {
    const response = await post("groq", GROQ_URL, groqHeaders(), groqBody(request, true), signal);
    const usage: LLMUsage = { promptTokens: 0, completionTokens: 0 };
    for await (const event of sseEvents(response.body!)) {
      const chunk = event as GroqChunk;
      const text = chunk.choices?.[0]?.delta?.content; // only `content`, never reasoning
      if (text) yield text;
      const u = chunk.usage ?? chunk.x_groq?.usage;
      if (u) {
        usage.promptTokens = u.prompt_tokens ?? usage.promptTokens;
        usage.completionTokens = u.completion_tokens ?? usage.completionTokens;
      }
    }
    return usage;
  },

  async complete(request, signal) {
    const response = await post("groq", GROQ_URL, groqHeaders(), groqBody(request, false), signal);
    const json = (await response.json()) as {
      choices: { message: { content: string | null } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: json.choices[0]?.message?.content?.trim() ?? "",
      usage: { promptTokens: json.usage?.prompt_tokens ?? 0, completionTokens: json.usage?.completion_tokens ?? 0 },
    };
  },
};

/* ---------------------------- Gemini -------------------------------- */

type GeminiChunk = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
};

function geminiBody(request: LLMRequest) {
  const system = request.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  return {
    ...(system && { systemInstruction: { parts: [{ text: system }] } }),
    contents: request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: {
      maxOutputTokens: request.maxOutputTokens,
      temperature: request.temperature,
      thinkingConfig: { thinkingLevel: "low", includeThoughts: false },
    },
  };
}

const geminiHeaders = () => ({ "x-goog-api-key": requireEnv("GEMINI_API_KEY") });
const geminiUrl = (model: string, method: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;

function geminiText(chunk: GeminiChunk) {
  return (chunk.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought) // never return thinking text
    .map((part) => part.text ?? "")
    .join("");
}

const geminiUsage = (chunk: GeminiChunk): LLMUsage => ({
  promptTokens: chunk.usageMetadata?.promptTokenCount ?? 0,
  completionTokens: (chunk.usageMetadata?.candidatesTokenCount ?? 0) + (chunk.usageMetadata?.thoughtsTokenCount ?? 0),
});

const gemini: LLMProvider = {
  async *stream(request, signal) {
    const response = await post(
      "gemini",
      `${geminiUrl(request.model, "streamGenerateContent")}?alt=sse`,
      geminiHeaders(),
      geminiBody(request),
      signal
    );
    let usage: LLMUsage = { promptTokens: 0, completionTokens: 0 };
    for await (const event of sseEvents(response.body!)) {
      const chunk = event as GeminiChunk;
      const text = geminiText(chunk);
      if (text) yield text;
      if (chunk.usageMetadata) usage = geminiUsage(chunk);
    }
    return usage;
  },

  async complete(request, signal) {
    const response = await post("gemini", geminiUrl(request.model, "generateContent"), geminiHeaders(), geminiBody(request), signal);
    const chunk = (await response.json()) as GeminiChunk;
    return { text: geminiText(chunk).trim(), usage: geminiUsage(chunk) };
  },
};

/* -------------------------------------------------------------------- */

const providers: Record<string, LLMProvider> = { groq, gemini };

export function llm(provider: string): LLMProvider {
  const selected = providers[provider];
  if (!selected) throw new Error(`Unknown LLM provider "${provider}"`);
  return selected;
}
