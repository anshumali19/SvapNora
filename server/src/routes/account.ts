import { Router } from "express";
import type { CookieOptions } from "express";
import { CSRF_COOKIE, USER_SESSION_COOKIE, USER_SESSION_MAX_AGE_MS, env } from "../env";
import { ApiError, asyncHandler, parseBody } from "../lib/http";
import { issueCsrfToken } from "../middleware/csrf";
import { accountLimiter, loginLimiter } from "../middleware/rateLimit";
import { requireUser } from "../middleware/auth";
import { prisma } from "../db";
import { recordAudit } from "../services/auditService";
import { isTransactionalEmailConfigured, sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validation/schemas";
import {
  consumeUserToken,
  createUserSession,
  createUserToken,
  hashPassword,
  publicUser,
  revokeAllUserSessions,
  revokeUserSessionByToken,
  verifyPassword,
} from "../services/userAuthService";

export const accountRouter = Router();

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: USER_SESSION_MAX_AGE_MS,
  };
}

function clearCookieOptions(): CookieOptions {
  return { path: "/", domain: env.COOKIE_DOMAIN || undefined };
}

/** Self-signup is only gated on email verification while SMTP is configured. */
function verificationRequired(): boolean {
  return isTransactionalEmailConfigured();
}

accountRouter.get("/session", (req, res) => {
  const csrfToken = issueCsrfToken(req, res);
  if (!req.user) {
    res.json({ authenticated: false, csrfToken });
    return;
  }
  res.json({ authenticated: true, user: publicUser(req.user.user), csrfToken });
});

accountRouter.post(
  "/register",
  accountLimiter,
  asyncHandler(async (req, res) => {
    const data = parseBody(registerSchema, req.body);
    issueCsrfToken(req, res);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("An account with this email already exists");

    const requireVerification = verificationRequired();
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name,
        company: data.company ?? null,
        passwordHash: await hashPassword(data.password),
        status: requireVerification ? "PENDING" : "ACTIVE",
        emailVerified: false,
        source: "SELF_SIGNUP",
      },
    });

    let verificationSent = false;
    if (requireVerification) {
      const token = await createUserToken(user.id, "EMAIL_VERIFICATION");
      const url = `${env.APP_ORIGIN}/account/verify?token=${encodeURIComponent(token)}`;
      verificationSent = await sendVerificationEmail(user.email, user.name, url);
    } else {
      const { token } = await createUserSession(user.id, {
        ip: req.ip,
        userAgent: req.get("user-agent") ?? null,
      });
      res.cookie(USER_SESSION_COOKIE, token, sessionCookieOptions());
    }

    await recordAudit({
      action: "user.register",
      targetType: "User",
      targetId: user.id,
      metadata: { verificationRequired: requireVerification, verificationSent },
      ip: req.ip,
    });

    res.status(201).json({
      registered: true,
      verificationRequired: requireVerification,
      verificationSent,
      authenticated: !requireVerification,
      user: !requireVerification ? publicUser(user) : undefined,
    });
  }),
);

accountRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);
    issueCsrfToken(req, res);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await verifyPassword(user.passwordHash, password) : false;
    if (!user || !valid) {
      await recordAudit({ action: "user.login.failed", actorEmail: email, ip: req.ip });
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (user.status === "SUSPENDED") {
      throw ApiError.forbidden("This account has been suspended");
    }
    if (verificationRequired() && user.source === "SELF_SIGNUP" && !user.emailVerified) {
      throw ApiError.forbidden("Please verify your email address before signing in");
    }

    const { token } = await createUserSession(user.id, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
    });
    res.cookie(USER_SESSION_COOKIE, token, sessionCookieOptions());
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAudit({ action: "user.login.success", actorEmail: user.email, ip: req.ip });

    res.json({ authenticated: true, user: publicUser(user) });
  }),
);

accountRouter.post(
  "/verify-email",
  accountLimiter,
  asyncHandler(async (req, res) => {
    const { token } = parseBody(verifyEmailSchema, req.body);
    const user = await consumeUserToken(token, "EMAIL_VERIFICATION");
    if (!user) throw ApiError.badRequest("This verification link is invalid or has expired");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, status: user.status === "PENDING" ? "ACTIVE" : user.status },
    });
    await recordAudit({ action: "user.email.verified", actorEmail: updated.email, ip: req.ip });
    res.json({ verified: true, user: publicUser(updated) });
  }),
);

accountRouter.post(
  "/resend-verification",
  accountLimiter,
  asyncHandler(async (req, res) => {
    const { email } = parseBody(forgotPasswordSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    let sent = false;
    if (user && user.source === "SELF_SIGNUP" && !user.emailVerified && verificationRequired()) {
      const token = await createUserToken(user.id, "EMAIL_VERIFICATION");
      const url = `${env.APP_ORIGIN}/account/verify?token=${encodeURIComponent(token)}`;
      sent = await sendVerificationEmail(user.email, user.name, url);
    }
    res.status(202).json({
      ok: true,
      sent,
      message: "If an account needs verification, a new email has been sent.",
    });
  }),
);

accountRouter.post(
  "/forgot-password",
  accountLimiter,
  asyncHandler(async (req, res) => {
    const { email } = parseBody(forgotPasswordSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    let sent = false;
    if (user && verificationRequired()) {
      const token = await createUserToken(user.id, "PASSWORD_RESET");
      const url = `${env.APP_ORIGIN}/account/reset-password?token=${encodeURIComponent(token)}`;
      sent = await sendPasswordResetEmail(user.email, user.name, url);
    }
    res.status(202).json({
      ok: true,
      sent,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  }),
);

accountRouter.post(
  "/reset-password",
  accountLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = parseBody(resetPasswordSchema, req.body);
    const user = await consumeUserToken(token, "PASSWORD_RESET");
    if (!user) throw ApiError.badRequest("This reset link is invalid or has expired");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        emailVerified: true,
        status: user.status === "PENDING" ? "ACTIVE" : user.status,
      },
    });
    await revokeAllUserSessions(user.id);
    await recordAudit({ action: "user.password.reset", actorEmail: user.email, ip: req.ip });
    res.json({ ok: true });
  }),
);

accountRouter.post(
  "/logout",
  requireUser,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[USER_SESSION_COOKIE] as string | undefined;
    await revokeUserSessionByToken(token);
    res.clearCookie(USER_SESSION_COOKIE, clearCookieOptions());
    res.clearCookie(CSRF_COOKIE, clearCookieOptions());
    if (req.user) {
      await recordAudit({ action: "user.logout", actorEmail: req.user.user.email, ip: req.ip });
    }
    res.json({ ok: true });
  }),
);

accountRouter.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const projects = await prisma.clientProject.findMany({
      where: { userId: req.user!.user.id },
      orderBy: [{ createdAt: "desc" }],
    });
    res.json({ user: publicUser(req.user!.user), projects });
  }),
);

accountRouter.patch(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const data = parseBody(profileUpdateSchema, req.body);
    const updated = await prisma.user.update({
      where: { id: req.user!.user.id },
      data: {
        name: data.name ?? undefined,
        company: data.company === undefined ? undefined : data.company,
      },
    });
    res.json({ user: publicUser(updated) });
  }),
);

accountRouter.post(
  "/change-password",
  requireUser,
  asyncHandler(async (req, res) => {
    const data = parseBody(changePasswordSchema, req.body);
    const user = req.user!.user;
    const valid = await verifyPassword(user.passwordHash, data.currentPassword);
    if (!valid) throw ApiError.badRequest("Your current password is incorrect");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.newPassword) },
    });
    // Keep the current session, revoke any others.
    await prisma.userSession.updateMany({
      where: { userId: user.id, id: { not: req.user!.sessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordAudit({ action: "user.password.change", actorEmail: user.email, ip: req.ip });
    res.json({ ok: true });
  }),
);
