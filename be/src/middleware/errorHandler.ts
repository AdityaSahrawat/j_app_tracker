import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const status = typeof (err as { status?: unknown }).status === "number" ? (err as { status: number }).status : 500;

  const expose =
    typeof (err as { expose?: unknown }).expose === "boolean"
      ? (err as { expose: boolean }).expose
      : status < 500;

  const rawMessage = (err as { message?: unknown }).message;
  const message =
    expose && typeof rawMessage === "string"
      ? rawMessage
      : status >= 500
        ? "Internal Server Error"
        : "Error";

  res.status(status).json({ error: typeof message === "string" ? message : "Error" });
};
