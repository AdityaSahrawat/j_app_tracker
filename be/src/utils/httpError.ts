export class HttpError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(status: number, message: string, options?: { expose?: boolean }) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.expose = options?.expose ?? status < 500;
  }
}
