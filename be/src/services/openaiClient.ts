import { getEnv } from "../config/env";
import { HttpError } from "../utils/httpError";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionRequest = {
  model: string;
  temperature?: number;
  response_format: { type: "json_object" };
  messages: ChatMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAssistantContent(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const choices = data.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const first = choices[0];
  if (!isRecord(first)) return null;

  const message = first.message;
  if (!isRecord(message)) return null;

  const content = message.content;
  return typeof content === "string" && content.trim() ? content : null;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function clampText(value: string, maxLen: number): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
}

function getOpenAiErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const err = data.error;
  if (!isRecord(err)) return null;

  const msg = err.message;
  return typeof msg === "string" && msg.trim() ? clampText(msg, 220) : null;
}

function buildUpstreamError(status: number, data: unknown): HttpError {
  const upstreamMessage = getOpenAiErrorMessage(data);

  if (status === 401 || status === 403) {
    return new HttpError(502, "AI authentication failed (check OPENAI_API_KEY)", { expose: true });
  }

  if (status === 404) {
    return new HttpError(502, "AI endpoint/model not found (check OPENAI_BASE_URL and OPENAI_MODEL)", {
      expose: true,
    });
  }

  if (status === 429) {
    return new HttpError(503, "AI rate limited — try again shortly", { expose: true });
  }

  if (status >= 500) {
    return new HttpError(503, "AI provider error — try again shortly", { expose: true });
  }

  if (upstreamMessage) {
    return new HttpError(502, `AI request rejected: ${upstreamMessage}`, { expose: true });
  }

  return new HttpError(502, `AI request failed (upstream ${status})`, { expose: true });
}

export async function openaiJsonChatCompletion(options: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown> {
  const env = getEnv();

  if (!env.OPENAI_API_KEY) {
    throw new HttpError(503, "AI is not configured", { expose: true });
  }

  const body: ChatCompletionRequest = {
    model: env.OPENAI_MODEL,
    temperature: options.temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
  };

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 20_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(joinUrl(env.OPENAI_BASE_URL, "/chat/completions"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data: unknown = null;
    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText) as unknown;
      } catch {
        data = rawText;
      }
    }

    if (!response.ok) {
      throw buildUpstreamError(response.status, data);
    }

    const content = getAssistantContent(data);
    if (!content) {
      throw new HttpError(502, "AI returned an invalid response", { expose: true });
    }

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new HttpError(502, "AI returned invalid JSON", { expose: true });
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;

    if (typeof err === "object" && err !== null && "name" in err && (err as { name?: unknown }).name === "AbortError") {
      throw new HttpError(504, "AI request timed out", { expose: true });
    }

    throw new HttpError(502, "AI request failed", { expose: true });
  } finally {
    clearTimeout(timeoutId);
  }
}
