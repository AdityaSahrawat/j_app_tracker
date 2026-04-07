import { openaiJsonChatCompletion } from "./openaiClient";

export type ParsedJobDescription = {
  company: string | null;
  role: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string | null;
  location: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  if (lowered === "n/a" || lowered === "na" || lowered === "unknown" || lowered === "none") {
    return null;
  }

  return trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (key === "n/a" || key === "na" || key === "unknown" || key === "none") continue;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);

    if (result.length >= 30) break;
  }

  return result;
}

function getField(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

export async function parseJobDescription(jobDescription: string): Promise<ParsedJobDescription> {
  const systemPrompt =
    "You extract structured information from a job description. " +
    "Return ONLY a JSON object with keys: " +
    "company (string|null), role (string|null), requiredSkills (string[]), niceToHaveSkills (string[]), " +
    "seniority (string|null), location (string|null). " +
    "Use null when unknown. Arrays must contain short skill phrases. No extra keys.";

  const userPrompt =
    "Job description:\n" +
    jobDescription +
    "\n\n" +
    "Extract the fields carefully. Do not invent company/role; use null if not present.";

  const raw = await openaiJsonChatCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    timeoutMs: 20_000,
  });

  if (!isRecord(raw)) {
    return {
      company: null,
      role: null,
      requiredSkills: [],
      niceToHaveSkills: [],
      seniority: null,
      location: null,
    };
  }

  const company = normalizeNullableString(
    getField(raw, ["company", "companyName", "employer"]) 
  );

  const role = normalizeNullableString(
    getField(raw, ["role", "title", "position"]) 
  );

  const requiredSkills = normalizeStringArray(
    getField(raw, ["requiredSkills", "required_skills", "mustHaveSkills", "must_have_skills"]) 
  );

  const niceToHaveSkills = normalizeStringArray(
    getField(raw, ["niceToHaveSkills", "nice_to_have_skills", "preferredSkills", "preferred_skills"]) 
  );

  const seniority = normalizeNullableString(
    getField(raw, ["seniority", "level", "experienceLevel", "experience_level"]) 
  );

  const location = normalizeNullableString(getField(raw, ["location"]) );

  return {
    company,
    role,
    requiredSkills,
    niceToHaveSkills,
    seniority,
    location,
  };
}
