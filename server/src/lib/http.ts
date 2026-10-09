import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Not permitted") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, "CONFLICT", message);
  }
  static tooMany(message = "Too many requests") {
    return new ApiError(429, "RATE_LIMITED", message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL", message);
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap async route handlers so rejected promises reach the error middleware. */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Parse and validate a request payload, throwing a 400 with field details. */
export function parseBody<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ApiError.badRequest("Validation failed", result.error.flatten());
  }
  return result.data;
}

export function parseQuery<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return parseBody(schema, data);
}

export function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError;
}
