import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Router } from "express";
import { getEnv } from "../config/env";
import { UserModel } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

type AuthTokenPayload = JwtPayload & { sub?: string };

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

function signAccessToken(userId: string): string {
  const env = getEnv();

  const payload: AuthTokenPayload = {
    sub: userId,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const emailRaw = typeof req.body?.email === "string" ? req.body.email : "";
    const passwordRaw = typeof req.body?.password === "string" ? req.body.password : "";

    const email = normalizeEmail(emailRaw);
    const password = passwordRaw;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "valid email is required" });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: "password must be at least 8 characters" });
      return;
    }

    const env = getEnv();
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    try {
      const created = await UserModel.create({ email, passwordHash });

      const token = signAccessToken(created._id.toString());

      res.status(201).json({
        token,
        user: {
          id: created._id.toString(),
          email: created.email,
        },
      });
    } catch (err) {
      if (isMongoDuplicateKeyError(err)) {
        res.status(409).json({ error: "email already registered" });
        return;
      }

      throw err;
    }
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const emailRaw = typeof req.body?.email === "string" ? req.body.email : "";
    const passwordRaw = typeof req.body?.password === "string" ? req.body.password : "";

    const email = normalizeEmail(emailRaw);
    const password = passwordRaw;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email }).select("+passwordHash");

    if (!user || typeof (user as { passwordHash?: unknown }).passwordHash !== "string") {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const passwordHash = (user as { passwordHash: string }).passwordHash;
    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const token = signAccessToken(user._id.toString());

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  })
);
