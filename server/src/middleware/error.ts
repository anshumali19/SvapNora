import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../lib/http";
import { logger } from "../logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: { code: "CONFLICT", message: "A unique constraint was violated" } });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
      return;
    }
  }

  logger.error({ err, path: req.path, method: req.method }, "unhandled error");
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}
