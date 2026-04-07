import mongoose from "mongoose";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMongoAuthError(err: unknown): boolean {
  if (!isRecord(err)) return false;

  const message = typeof err.message === "string" ? err.message : "";
  const code = typeof err.code === "number" ? err.code : undefined;

  return (
    message.toLowerCase().includes("authentication failed") ||
    message.toLowerCase().includes("bad auth") ||
    code === 8000
  );
}

export async function connectToDatabase(mongoUri: string): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    if (isMongoAuthError(err)) {
      console.error(
        "MongoDB authentication failed. Check MONGODB_URI username/password, URL-encode special characters in the password, and verify the DB user exists (Atlas: Database Access)."
      );
      console.error(
        "If using Atlas, also ensure your IP is allowed (Atlas: Network Access)."
      );
    }

    throw err;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}
