import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { authRouter } from "./routes/auth";
import { applicationsRouter } from "./routes/applications";
import { aiRouter } from "./routes/ai";
import { healthRouter } from "./routes/health";
import { itemsRouter } from "./routes/items";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/items", itemsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
