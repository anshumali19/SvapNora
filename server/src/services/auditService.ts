import { prisma } from "../db";
import { logger } from "../logger";

export interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/** Best-effort audit logging. Never throws into the request path. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: (input.metadata ?? undefined) as never,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, action: input.action }, "failed to write audit log");
  }
}
