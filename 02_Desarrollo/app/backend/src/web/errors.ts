import type { NextFunction, Request, Response } from "express";
import { env } from "../system/env.js";

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
  const body: { ok: false; error: string; message?: string } = { ok: false, error: "INTERNAL_ERROR" };
  if (env.nodeEnv !== "production") body.message = message;
  res.status(500).json(body);
}

