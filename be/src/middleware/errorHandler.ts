import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const status = typeof (err as { status?: unknown }).status === "number" ? (err as { status: number }).status : 500;

  const message = status >= 500 ? "Internal Server Error" : (err as { message?: unknown }).message;

  res.status(status).json({ error: typeof message === "string" ? message : "Error" });
};
