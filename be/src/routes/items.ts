import { Router } from "express";
import { ItemModel } from "../models/Item";
import { asyncHandler } from "../utils/asyncHandler";

export const itemsRouter = Router();

itemsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await ItemModel.find().sort({ createdAt: -1 }).limit(50);
    res.json({ items });
  })
);

itemsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const created = await ItemModel.create({ name });
    res.status(201).json({ item: created });
  })
);
