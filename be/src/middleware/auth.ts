import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { getEnv } from "../config/env";

type AuthTokenPayload = JwtPayload & { sub?: string };

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.header("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }

  const token = match[1].trim();
  if (!token) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }

  const env = getEnv();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== "object" || decoded === null) {
      res.status(401).json({ error: "invalid token" });
      return;
    }

    const userId = (decoded as AuthTokenPayload).sub;
    if (typeof userId !== "string" || !userId) {
      res.status(401).json({ error: "invalid token" });
      return;
    }

    req.auth = { userId };
    next();
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
};
