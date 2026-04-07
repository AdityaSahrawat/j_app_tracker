import { HttpError } from "../utils/httpError";
import type { ParsedJobDescription } from "./jdParser";
import { openaiJsonChatCompletion } from "./openaiClient";

export type ResumeSuggestionsInput = {
  jobDescription: string;
  parsed?: ParsedJobDescription;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getField(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

function normalizeBullet(text: string): string {
  const trimmed = text.trim();
  const withoutPrefix = trimmed.replace(/^[-•*\u2022]\s+/, "");
  return withoutPrefix.replace(/\s+/g, " ").trim();
}

function uniqueLimit(items: string[], limit: number): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const normalized = normalizeBullet(item);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

function extractBullets(raw: unknown): string[] {
  if (!isRecord(raw)) return [];

  const bulletsRaw = getField(raw, [
    "bullets",
    "bulletPoints",
    "bullet_points",
    "resumeBullets",
    "resume_bullets",
    "suggestions",
  ]);

  if (Array.isArray(bulletsRaw)) {
    const strings: string[] = [];
    for (const b of bulletsRaw) {
      if (typeof b === "string") {
        strings.push(b);
        continue;
      }
      if (isRecord(b) && typeof b.text === "string") {
        strings.push(b.text);
      }
    }
    return uniqueLimit(strings, 5);
  }

  if (typeof bulletsRaw === "string") {
    const lines = bulletsRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return uniqueLimit(lines, 5);
  }

  return [];
}

function safeString(value: string | null | undefined): string {
  return typeof value === "string" && value.trim() ? value.trim() : "(unknown)";
}

export async function generateResumeBullets(input: ResumeSuggestionsInput): Promise<string[]> {
  const jd = input.jobDescription.trim();
  if (!jd) {
    throw new HttpError(400, "jobDescription is required");
  }

  const parsed = input.parsed;

  const systemPrompt =
    "You generate resume bullet points tailored to a job description. " +
    "Return ONLY valid JSON with a single key bullets (string[]). " +
    "bullets must have 3 to 5 items. Each bullet must be a single concise sentence, " +
    "start with a strong action verb, and be realistic: do NOT invent metrics, employers, or technologies. " +
    "No markdown, no numbering, no extra keys.";

  const userPrompt =
    "Job context:\n" +
    `Company: ${safeString(parsed?.company)}\n` +
    `Role: ${safeString(parsed?.role)}\n` +
    `Seniority: ${safeString(parsed?.seniority)}\n` +
    `Location: ${safeString(parsed?.location)}\n` +
    `Required skills: ${(parsed?.requiredSkills ?? []).join(", ") || "(unknown)"}\n` +
    `Nice-to-have skills: ${(parsed?.niceToHaveSkills ?? []).join(", ") || "(unknown)"}\n\n` +
    "Job description:\n" +
    jd +
    "\n\n" +
    "Generate 3-5 bullets a candidate could add to their resume to match this role.";

  const raw = await openaiJsonChatCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    timeoutMs: 25_000,
  });

  const bullets = extractBullets(raw);

  if (bullets.length < 3) {
    throw new HttpError(502, "AI returned invalid resume suggestions", { expose: true });
  }

  return bullets;
}
