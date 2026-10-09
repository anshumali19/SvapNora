import { Router } from "express";
import { ApiError, asyncHandler, parseBody } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { prisma } from "../../db";
import { hashPassword, revokeAllSessionsForUser } from "../../services/authService";
import { recordAudit } from "../../services/auditService";
import { adminCreateSchema, idParamSchema } from "../../validation/schemas";
import { z } from "zod";

export const adminsAdminRouter = Router();

const canManage = requirePermission("admin.manage");

const publicAdmin = (u: {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  isActive: u.isActive,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
});

const updateAdminSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
});

adminsAdminRouter.get(
  "/",
  canManage,
  asyncHandler(async (_req, res) => {
    const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ items: users.map(publicAdmin) });
  }),
);

adminsAdminRouter.post(
  "/",
  canManage,
  asyncHandler(async (req, res) => {
    const data = parseBody(adminCreateSchema, req.body);
    const passwordHash = await hashPassword(data.password);
    const created = await prisma.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role,
        passwordHash,
      },
    });
    await recordAudit({
      actorId: req.admin!.user.id,
      actorEmail: req.admin!.user.email,
      action: "admin.create",
      targetType: "AdminUser",
      targetId: created.id,
      metadata: { role: created.role },
      ip: req.ip,
    });
    res.status(201).json({ admin: publicAdmin(created) });
  }),
);

adminsAdminRouter.patch(
  "/:id",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(updateAdminSchema, req.body);
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw ApiError.notFound("Administrator not found");

    // Prevent locking out the last active OWNER.
    const demotingOwner = target.role === "OWNER" && (data.role && data.role !== "OWNER");
    const deactivating = target.isActive && data.isActive === false;
    if ((demotingOwner || deactivating) && target.role === "OWNER") {
      const activeOwners = await prisma.adminUser.count({ where: { role: "OWNER", isActive: true } });
      if (activeOwners <= 1) {
        throw ApiError.conflict("Cannot demote or deactivate the last active owner");
      }
    }

    const updated = await prisma.adminUser.update({ where: { id }, data });
    if (data.isActive === false || data.role) {
      await revokeAllSessionsForUser(id);
    }
    await recordAudit({
      actorId: req.admin!.user.id,
      actorEmail: req.admin!.user.email,
      action: "admin.update",
      targetType: "AdminUser",
      targetId: id,
      metadata: { fields: Object.keys(data) },
      ip: req.ip,
    });
    res.json({ admin: publicAdmin(updated) });
  }),
);

adminsAdminRouter.post(
  "/:id/revoke-sessions",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const count = await revokeAllSessionsForUser(id);
    await recordAudit({
      actorId: req.admin!.user.id,
      actorEmail: req.admin!.user.email,
      action: "admin.revoke_sessions",
      targetType: "AdminUser",
      targetId: id,
      metadata: { count },
      ip: req.ip,
    });
    res.json({ ok: true, revoked: count });
  }),
);
