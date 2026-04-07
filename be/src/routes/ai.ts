import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { parseJobDescription, type ParsedJobDescription } from "../services/jdParser";
import { generateResumeBullets } from "../services/resumeSuggestions";
import { asyncHandler } from "../utils/asyncHandler";

export const aiRouter = Router();

aiRouter.use(requireAuth);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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
    if (seen.has(key)) continue;
    seen.add(key);

    result.push(trimmed);
    if (result.length >= 30) break;
  }

  return result;
}

function parseParsedJobDescription(raw: unknown): ParsedJobDescription | undefined {
  if (!isRecord(raw)) return undefined;

  return {
    company: normalizeNullableString(raw.company),
    role: normalizeNullableString(raw.role),
    requiredSkills: normalizeStringArray(raw.requiredSkills),
    niceToHaveSkills: normalizeStringArray(raw.niceToHaveSkills),
    seniority: normalizeNullableString(raw.seniority),
    location: normalizeNullableString(raw.location),
  };
}

aiRouter.post(
  "/parse-jd",
  asyncHandler(async (req, res) => {
    const jobDescriptionRaw = typeof req.body?.jobDescription === "string" ? req.body.jobDescription : "";
    const jobDescription = jobDescriptionRaw.trim();

    if (!jobDescription) {
      res.status(400).json({ error: "jobDescription is required" });
      return;
    }

    if (jobDescription.length > 20_000) {
      res.status(400).json({ error: "jobDescription is too long" });
      return;
    }

    const parsed = await parseJobDescription(jobDescription);

    res.json({ parsed });
  })
);

aiRouter.post(
  "/resume-suggestions",
  asyncHandler(async (req, res) => {
    const jobDescriptionRaw = typeof req.body?.jobDescription === "string" ? req.body.jobDescription : "";
    const jobDescription = jobDescriptionRaw.trim();

    if (!jobDescription) {
      res.status(400).json({ error: "jobDescription is required" });
      return;
    }

    if (jobDescription.length > 20_000) {
      res.status(400).json({ error: "jobDescription is too long" });
      return;
    }

    const parsed = parseParsedJobDescription(req.body?.parsed);
    const bullets = await generateResumeBullets({ jobDescription, parsed });

    res.json({ bullets });
  })
);
