import crypto from "crypto";
import { hash, verify } from "@node-rs/argon2";
import type { AdminSession, AdminUser } from "@prisma/client";
import { prisma } from "../db";
import { env, SESSION_MAX_AGE_MS } from "../env";
import { logger } from "../logger";

// OWASP-recommended Argon2id parameters (19 MiB, t=2, p=1).
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2, // Argon2id
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch (err) {
    logger.error({ err }, "password verification failed");
    return false;
  }
}

/** Hash an opaque session token with a server-side pepper before storage. */
function hashToken(token: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

export interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; session: AdminSession }> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  const session = await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
  return { token, session };
}

export async function resolveSession(
  token: string | undefined | null,
): Promise<{ session: AdminSession; user: AdminUser } | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (!session.user.isActive) return null;
  return { session, user: session.user };
}

export async function touchSession(sessionId: string): Promise<void> {
  await prisma.adminSession
    .update({ where: { id: sessionId }, data: { lastSeenAt: new Date() } })
    .catch(() => undefined);
}

export async function revokeSessionByToken(token: string | undefined | null): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.adminSession
    .updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

export async function revokeAllSessionsForUser(userId: string): Promise<number> {
  const result = await prisma.adminSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function purgeExpiredSessions(): Promise<number> {
  const result = await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
