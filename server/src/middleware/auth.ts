import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE, USER_SESSION_COOKIE } from "../env";
import { ApiError } from "../lib/http";
import { roleHasPermission, type Permission } from "../lib/permissions";
import { resolveSession } from "../services/authService";
import { resolveUserSession } from "../services/userAuthService";

/** Populate req.admin from a valid session cookie, if present. Never throws. */
export async function attachAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const resolved = await resolveSession(token);
    if (resolved) {
      req.admin = { user: resolved.user, sessionId: resolved.session.id };
    }
  } catch {
    // ignore — unauthenticated requests proceed without an admin context
  }
  next();
}

/** Populate req.user from a valid end-user session cookie, if present. */
export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[USER_SESSION_COOKIE] as string | undefined;
    const resolved = await resolveUserSession(token);
    if (resolved) {
      req.user = { user: resolved.user, sessionId: resolved.session.id };
    }
  } catch {
    // ignore — unauthenticated requests proceed without a user context
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.admin) return next(ApiError.unauthorized());
  next();
}

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(ApiError.unauthorized());
  next();
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) return next(ApiError.unauthorized());
    if (!roleHasPermission(req.admin.user.role, permission)) {
      return next(ApiError.forbidden(`Missing permission: ${permission}`));
    }
    next();
  };
}
