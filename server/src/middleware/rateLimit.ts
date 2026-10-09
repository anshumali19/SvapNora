import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { env } from "../env";

/** Login attempts: rate limited by IP + submitted email. */
export const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return `${req.ip}:${email}`;
  },
  message: { error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." } },
});

/** Contact submissions: rate limited by IP. */
export const contactLimiter = rateLimit({
  windowMs: env.CONTACT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.CONTACT_RATE_LIMIT_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Too many messages sent. Please try again later." },
  },
});

/** Account actions (signup, password reset, resend verification). */
export const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
  },
});

/** Generic API limiter as a coarse safety net. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
