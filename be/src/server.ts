import { connectToDatabase, disconnectFromDatabase } from "./config/db";
import { getEnv } from "./config/env";
import { createApp } from "./app";

async function main() {
  const env = getEnv();

  await connectToDatabase(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);

    server.close(async () => {
      await disconnectFromDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
