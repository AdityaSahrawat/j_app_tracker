import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { parseJobDescription } from "../services/jdParser";
import { asyncHandler } from "../utils/asyncHandler";

export const aiRouter = Router();

aiRouter.use(requireAuth);

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
