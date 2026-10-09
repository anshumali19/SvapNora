import crypto from "crypto";
import { env } from "../env";

/** Generate a high-entropy opaque token (URL-safe, 256 bits). */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Hash an opaque token with a server-side pepper (SESSION_SECRET) before it is
 * persisted. Raw tokens are only ever held in cookies or emailed links.
 */
export function hashOpaqueToken(token: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}
