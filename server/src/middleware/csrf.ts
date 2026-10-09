import crypto from "crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { CSRF_COOKIE, env } from "../env";
import { ApiError } from "../lib/http";

function cookieOptions(): CookieOptions {
  return {
    httpOnly: false, // must be readable by the SPA to echo in a header
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: 12 * 60 * 60 * 1000,
  };
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Ensure a CSRF token exists in a readable cookie for double-submit checks. */
export function issueCsrfToken(req: Request, res: Response): string {
  const existing = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (existing) return existing;
  const token = crypto.randomBytes(24).toString("base64url");
  res.cookie(CSRF_COOKIE, token, cookieOptions());
  return token;
}

/** Double-submit cookie CSRF protection for state-changing requests. */
export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return next(ApiError.forbidden("Invalid or missing CSRF token"));
  }
  next();
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
