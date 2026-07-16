import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err?.message ?? "Internal server error";
  if (status >= 500) {
    console.error("[error]", err);
  }
  res.status(status).json({ error: status >= 500 ? "internal_error" : "request_error", message });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "not_found", message: `No route for ${req.method} ${req.originalUrl}` });
}
