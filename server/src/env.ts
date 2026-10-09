import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : ["1", "true", "yes", "on"].includes(v.toLowerCase())));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  API_ORIGIN: z.string().url().default("http://localhost:4000"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1),

  SESSION_SECRET: z.string().min(16),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(12),
  USER_SESSION_TTL_HOURS: z.coerce.number().positive().default(168),
  VERIFY_TOKEN_TTL_HOURS: z.coerce.number().positive().default(24),
  RESET_TOKEN_TTL_HOURS: z.coerce.number().positive().default(1),
  COOKIE_DOMAIN: z.string().default(""),
  COOKIE_SECURE: booleanish.default(false),
  TRUST_PROXY: booleanish.default(false),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(8),
  CONTACT_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(60),
  CONTACT_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(5),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_NAME: z.string().default("Administrator"),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_ROLE: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).default("OWNER"),

  EMAIL_PROVIDER: z.enum(["none", "smtp", "brevo"]).default("none"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanish.default(false),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  // Brevo transactional email HTTP API (works where outbound SMTP is blocked).
  BREVO_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("SvapNora <no-reply@example.com>"),
  CONTACT_TO_EMAIL: z.string().default(""),

  PAYMENT_PROVIDER: z.enum(["none", "stripe", "razorpay"]).default("none"),
  PAYMENTS_CURRENCY: z.string().default("USD"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().default(""),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  PAYMENTS_DEMO_MODE: booleanish.default(true),
});

export type AppEnv = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  isProduction: boolean;
  isTest: boolean;
};

function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. See .env.example for required variables.");
  }
  const data = parsed.data;

  if (data.NODE_ENV === "production") {
    if (data.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    }
    if (!data.COOKIE_SECURE) {
      throw new Error("COOKIE_SECURE must be true in production (HTTPS only).");
    }
  }

  return {
    ...data,
    corsOrigins: data.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isProduction: data.NODE_ENV === "production",
    isTest: data.NODE_ENV === "test",
  };
}

export const env = loadEnv();

export const SESSION_COOKIE = "svapnora_session";
export const USER_SESSION_COOKIE = "svapnora_user_session";
export const CSRF_COOKIE = "svapnora_csrf";
export const SESSION_MAX_AGE_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;
export const USER_SESSION_MAX_AGE_MS = env.USER_SESSION_TTL_HOURS * 60 * 60 * 1000;
