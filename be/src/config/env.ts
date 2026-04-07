import dotenv from "dotenv";

export type Env = {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
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
    throw new Error("Missing required env var: MONGODB_URI");
  }

  cachedEnv = {
    NODE_ENV: nodeEnv,
    PORT: Number.isFinite(port) ? port : 4000,
    MONGODB_URI: mongoUri,
  };

  return cachedEnv;
}
