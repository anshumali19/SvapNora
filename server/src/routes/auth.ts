import { Router } from "express";
import type { CookieOptions } from "express";
import { CSRF_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_MS, env } from "../env";
import { ApiError, asyncHandler, parseBody } from "../lib/http";
import { issueCsrfToken } from "../middleware/csrf";
import { loginLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import { createSession, revokeSessionByToken, verifyPassword } from "../services/authService";
import { recordAudit } from "../services/auditService";
import { prisma } from "../db";
import { loginSchema } from "../validation/schemas";

export const authRouter = Router();

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: SESSION_MAX_AGE_MS,
  };
}

function publicAdmin(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

authRouter.get("/csrf", (req, res) => {
  const csrfToken = issueCsrfToken(req, res);
  res.json({ csrfToken });
});

authRouter.get("/session", (req, res) => {
  const csrfToken = issueCsrfToken(req, res);
  if (!req.admin) {
    res.json({ authenticated: false, csrfToken });
    return;
  }
  res.json({ authenticated: true, admin: publicAdmin(req.admin.user), csrfToken });
});

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);
    issueCsrfToken(req, res);

    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    // Always run a verification to reduce user-enumeration timing signals.
    const valid = user ? await verifyPassword(user.passwordHash, password) : false;
    if (!user || !valid || !user.isActive) {
      await recordAudit({
        actorEmail: email,
        action: "auth.login.failed",
        ip: req.ip,
      });
      throw ApiError.unauthorized("Invalid email or password");
    }

    const { token, session } = await createSession(user.id, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
    });

    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "auth.login.success",
      targetType: "AdminSession",
      targetId: session.id,
      ip: req.ip,
    });

    res.json({ authenticated: true, admin: publicAdmin(user) });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await revokeSessionByToken(token);
    res.clearCookie(SESSION_COOKIE, { path: "/", domain: env.COOKIE_DOMAIN || undefined });
    res.clearCookie(CSRF_COOKIE, { path: "/", domain: env.COOKIE_DOMAIN || undefined });
    if (req.admin) {
      await recordAudit({
        actorId: req.admin.user.id,
        actorEmail: req.admin.user.email,
        action: "auth.logout",
        ip: req.ip,
      });
    }
    res.json({ ok: true });
  }),
);
