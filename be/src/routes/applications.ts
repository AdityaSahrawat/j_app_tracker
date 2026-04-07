import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth";
import {
  APPLICATION_STATUSES,
  ApplicationModel,
  type ApplicationStatus,
} from "../models/Application";
import { asyncHandler } from "../utils/asyncHandler";

type ApplicationResponse = {
  id: string;
  company: string;
  role: string;
  jdLink?: string;
  notes?: string;
  dateApplied: string;
  status: ApplicationStatus;
  salaryRange?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function parseDateApplied(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function serializeApplication(doc: {
  _id: unknown;
  company: string;
  role: string;
  jdLink?: string;
  notes?: string;
  dateApplied: Date;
  status: ApplicationStatus;
  salaryRange?: string;
}): ApplicationResponse {
  const id = typeof doc._id === "string" ? doc._id : String(doc._id);

  return {
    id,
    company: doc.company,
    role: doc.role,
    jdLink: doc.jdLink,
    notes: doc.notes,
    dateApplied: doc.dateApplied.toISOString().slice(0, 10),
    status: doc.status,
    salaryRange: doc.salaryRange,
  };
}

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

applicationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const apps = await ApplicationModel.find({ userId })
      .sort({ dateApplied: -1, createdAt: -1 })
      .limit(200);

    res.json({ applications: apps.map(serializeApplication) });
  })
);

applicationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const companyRaw = req.body?.company;
    const roleRaw = req.body?.role;
    const statusRaw = req.body?.status;
    const dateAppliedRaw = req.body?.dateApplied;

    const company = typeof companyRaw === "string" ? companyRaw.trim() : "";
    const role = typeof roleRaw === "string" ? roleRaw.trim() : "";

    if (!company) {
      res.status(400).json({ error: "company is required" });
      return;
    }

    if (!role) {
      res.status(400).json({ error: "role is required" });
      return;
    }

    if (typeof statusRaw !== "string" || !isApplicationStatus(statusRaw)) {
      res.status(400).json({ error: "status is invalid" });
      return;
    }

    const dateApplied = parseDateApplied(dateAppliedRaw);
    if (!dateApplied) {
      res.status(400).json({ error: "dateApplied is required" });
      return;
    }

    const jdLink = asOptionalTrimmedString(req.body?.jdLink);
    const notes = asOptionalTrimmedString(req.body?.notes);
    const salaryRange = asOptionalTrimmedString(req.body?.salaryRange);

    const created = await ApplicationModel.create({
      userId,
      company,
      role,
      status: statusRaw,
      dateApplied,
      jdLink,
      notes,
      salaryRange,
    });

    res.status(201).json({ application: serializeApplication(created) });
  })
);

applicationsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }

    const app = await ApplicationModel.findOne({ _id: id, userId });
    if (!app) {
      res.status(404).json({ error: "not found" });
      return;
    }

    res.json({ application: serializeApplication(app) });
  })
);

applicationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }

    const update: Partial<{
      company: string;
      role: string;
      jdLink?: string;
      notes?: string;
      dateApplied: Date;
      status: ApplicationStatus;
      salaryRange?: string;
    }> = {};

    if (req.body && "company" in req.body) {
      const company = typeof req.body.company === "string" ? req.body.company.trim() : "";
      if (!company) {
        res.status(400).json({ error: "company must be a non-empty string" });
        return;
      }
      update.company = company;
    }

    if (req.body && "role" in req.body) {
      const role = typeof req.body.role === "string" ? req.body.role.trim() : "";
      if (!role) {
        res.status(400).json({ error: "role must be a non-empty string" });
        return;
      }
      update.role = role;
    }

    if (req.body && "status" in req.body) {
      const statusRaw = req.body.status;
      if (typeof statusRaw !== "string" || !isApplicationStatus(statusRaw)) {
        res.status(400).json({ error: "status is invalid" });
        return;
      }
      update.status = statusRaw;
    }

    if (req.body && "dateApplied" in req.body) {
      const date = parseDateApplied(req.body.dateApplied);
      if (!date) {
        res.status(400).json({ error: "dateApplied is invalid" });
        return;
      }
      update.dateApplied = date;
    }

    if (req.body && "jdLink" in req.body) {
      const jdLink = asOptionalTrimmedString(req.body.jdLink);
      update.jdLink = jdLink;
    }

    if (req.body && "notes" in req.body) {
      const notes = asOptionalTrimmedString(req.body.notes);
      update.notes = notes;
    }

    if (req.body && "salaryRange" in req.body) {
      const salaryRange = asOptionalTrimmedString(req.body.salaryRange);
      update.salaryRange = salaryRange;
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "no valid fields to update" });
      return;
    }

    const updated = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }

    res.json({ application: serializeApplication(updated) });
  })
);

applicationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }

    const deleted = await ApplicationModel.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      res.status(404).json({ error: "not found" });
      return;
    }

    res.status(204).send();
  })
);
