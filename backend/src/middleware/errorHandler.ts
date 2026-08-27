import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Prisma unique constraint / known request errors surface a "code" field.
  const maybePrismaError = err as { code?: string; meta?: { target?: string[] } };
  if (maybePrismaError?.code === "P2002") {
    const target = maybePrismaError.meta?.target?.join(", ") ?? "field";
    return res.status(409).json({ error: `A record with this ${target} already exists.` });
  }
  if (maybePrismaError?.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
}
