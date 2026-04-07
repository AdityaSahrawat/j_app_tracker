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
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = (await response.json()) as unknown;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new HttpError(502, "AI request failed", { expose: true });
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
