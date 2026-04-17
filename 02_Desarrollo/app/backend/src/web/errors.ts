import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: "NOT_FOUND" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ ok: false, error: "INTERNAL_ERROR", message });
}

