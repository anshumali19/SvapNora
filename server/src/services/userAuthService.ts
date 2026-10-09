import type { User, UserSession, UserTokenType } from "@prisma/client";
import { prisma } from "../db";
import { USER_SESSION_MAX_AGE_MS, env } from "../env";
import { generateOpaqueToken, hashOpaqueToken } from "../lib/tokens";

export { hashPassword, verifyPassword } from "./authService";

export interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  company: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
}

export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

// --- Sessions ----------------------------------------------------------------

export async function createUserSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; session: UserSession }> {
  const token = generateOpaqueToken();
  const session = await prisma.userSession.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + USER_SESSION_MAX_AGE_MS),
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
  return { token, session };
}

export async function resolveUserSession(
  token: string | undefined | null,
): Promise<{ session: UserSession; user: User } | null> {
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status === "SUSPENDED") return null;
  return { session, user: session.user };
}

export async function touchUserSession(sessionId: string): Promise<void> {
  await prisma.userSession
    .update({ where: { id: sessionId }, data: { lastSeenAt: new Date() } })
    .catch(() => undefined);
}

export async function revokeUserSessionByToken(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await prisma.userSession
    .updateMany({
      where: { tokenHash: hashOpaqueToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}

export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

// --- Single-use tokens (verification / reset) --------------------------------

export async function createUserToken(userId: string, type: UserTokenType): Promise<string> {
  const token = generateOpaqueToken();
  const hours = type === "PASSWORD_RESET" ? env.RESET_TOKEN_TTL_HOURS : env.VERIFY_TOKEN_TTL_HOURS;
  // Invalidate any outstanding tokens of the same type before issuing a new one.
  await prisma.userToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.userToken.create({
    data: {
      userId,
      type,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function consumeUserToken(token: string, type: UserTokenType): Promise<User | null> {
  const record = await prisma.userToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { user: true },
  });
  if (!record || record.type !== type) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  await prisma.userToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.user;
}

// --- Maintenance -------------------------------------------------------------

export async function purgeExpiredUserArtifacts(): Promise<{ sessions: number; tokens: number }> {
  const now = new Date();
  const [sessions, tokens] = await Promise.all([
    prisma.userSession.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.userToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  return { sessions: sessions.count, tokens: tokens.count };
}
