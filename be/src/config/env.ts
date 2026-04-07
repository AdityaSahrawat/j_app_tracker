import dotenv from "dotenv";
import type { StringValue } from "ms";

export type Env = {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: StringValue;
  BCRYPT_SALT_ROUNDS: number;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  OPENAI_BASE_URL: string;
};

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  dotenv.config();

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const portRaw = process.env.PORT ?? "4000";
  const port = Number.parseInt(portRaw, 10);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error(
      "Missing required env var: MONGODB_URI (set it in be/.env; see be/.env.example)"
    );
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "Missing required env var: JWT_SECRET (set it in be/.env; see be/.env.example)"
    );
  }

  const jwtExpiresInRaw = process.env.JWT_EXPIRES_IN ?? "7d";
  const jwtExpiresIn: StringValue = /^-?\d+(\.\d+)?(ms|s|m|h|d|w|y)$/.test(jwtExpiresInRaw.trim())
    ? (jwtExpiresInRaw.trim() as StringValue)
    : "7d";

  const saltRoundsRaw = process.env.BCRYPT_SALT_ROUNDS ?? "12";
  const saltRounds = Number.parseInt(saltRoundsRaw, 10);

  const openaiApiKeyRaw = process.env.OPENAI_API_KEY;
  const openaiApiKey = typeof openaiApiKeyRaw === "string" && openaiApiKeyRaw.trim() ? openaiApiKeyRaw.trim() : undefined;

  const openaiModelRaw = process.env.OPENAI_MODEL;
  const openaiModel = typeof openaiModelRaw === "string" && openaiModelRaw.trim() ? openaiModelRaw.trim() : "gpt-4o-mini";

  const openaiBaseUrlRaw = process.env.OPENAI_BASE_URL;
  const openaiBaseUrl = typeof openaiBaseUrlRaw === "string" && openaiBaseUrlRaw.trim() ? openaiBaseUrlRaw.trim() : "https://api.openai.com/v1";

  cachedEnv = {
    NODE_ENV: nodeEnv,
    PORT: Number.isFinite(port) ? port : 4000,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    BCRYPT_SALT_ROUNDS: Number.isFinite(saltRounds) ? saltRounds : 12,
    OPENAI_API_KEY: openaiApiKey,
    OPENAI_MODEL: openaiModel,
    OPENAI_BASE_URL: openaiBaseUrl,
  };

  return cachedEnv;
}
