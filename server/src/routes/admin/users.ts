import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { Prisma, type User } from "@prisma/client";
import { ApiError, asyncHandler, parseBody, parseQuery } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { prisma } from "../../db";
import { recordAudit } from "../../services/auditService";
import { isTransactionalEmailConfigured, sendClientWelcomeEmail } from "../../services/emailService";
import { hashPassword, revokeAllUserSessions } from "../../services/userAuthService";
import {
  clientCreateSchema,
  clientUpdateSchema,
  idParamSchema,
  paginationSchema,
  projectSchema,
  projectUpdateSchema,
} from "../../validation/schemas";

export const usersAdminRouter = Router();

const canManage = requirePermission("users.manage");

const listQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});

function adminUserView(user: User, projectCount = 0) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    status: user.status,
    source: user.source,
    emailVerified: user.emailVerified,
    projectCount,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

function actor(req: import("express").Request) {
  return { actorId: req.admin!.user.id, actorEmail: req.admin!.user.email, ip: req.ip };
}

usersAdminRouter.get(
  "/",
  canManage,
  asyncHandler(async (req, res) => {
    const { page, pageSize, search, status } = parseQuery(listQuerySchema, req.query);
    const where: Prisma.UserWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }
    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { projects: true } } },
      }),
    ]);
    res.json({
      items: rows.map((u) => adminUserView(u, u._count.projects)),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  }),
);

usersAdminRouter.post(
  "/",
  canManage,
  asyncHandler(async (req, res) => {
    const data = parseBody(clientCreateSchema, req.body);
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const provided = Boolean(data.password);
    const temporaryPassword = data.password ?? generateTempPassword();
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name,
        company: data.company ?? null,
        passwordHash: await hashPassword(temporaryPassword),
        status: data.status,
        emailVerified: true,
        source: "INVITED",
      },
    });

    let inviteSent = false;
    if (data.sendInvite && isTransactionalEmailConfigured()) {
      inviteSent = await sendClientWelcomeEmail(user.email, user.name, {
        temporaryPassword: provided ? undefined : temporaryPassword,
      });
    }

    await recordAudit({
      ...actor(req),
      action: "user.create",
      targetType: "User",
      targetId: user.id,
      metadata: { status: user.status, inviteSent },
    });

    res.status(201).json({
      user: adminUserView(user, 0),
      temporaryPassword: provided ? undefined : temporaryPassword,
      inviteSent,
    });
  }),
);

usersAdminRouter.patch(
  "/:id",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(clientUpdateSchema, req.body);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw ApiError.notFound("User not found");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        company: data.company === undefined ? undefined : data.company,
        status: data.status ?? undefined,
      },
    });
    if (data.status === "SUSPENDED") await revokeAllUserSessions(id);

    await recordAudit({
      ...actor(req),
      action: "user.update",
      targetType: "User",
      targetId: id,
      metadata: { fields: Object.keys(data) },
    });
    res.json({ user: adminUserView(updated) });
  }),
);

usersAdminRouter.delete(
  "/:id",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    await prisma.user.delete({ where: { id } });
    await recordAudit({ ...actor(req), action: "user.delete", targetType: "User", targetId: id });
    res.json({ ok: true });
  }),
);

usersAdminRouter.post(
  "/:id/revoke-sessions",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const count = await revokeAllUserSessions(id);
    await recordAudit({
      ...actor(req),
      action: "user.revoke_sessions",
      targetType: "User",
      targetId: id,
      metadata: { count },
    });
    res.json({ ok: true, revoked: count });
  }),
);

usersAdminRouter.post(
  "/:id/reset-password",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw ApiError.notFound("User not found");

    const temporaryPassword = generateTempPassword();
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(temporaryPassword) },
    });
    await revokeAllUserSessions(id);

    let sent = false;
    if (isTransactionalEmailConfigured()) {
      sent = await sendClientWelcomeEmail(target.email, target.name, { temporaryPassword });
    }
    await recordAudit({
      ...actor(req),
      action: "user.password.reset_by_admin",
      targetType: "User",
      targetId: id,
      metadata: { sent },
    });
    res.json({ ok: true, temporaryPassword, sent });
  }),
);

// --- Portal projects ---------------------------------------------------------

usersAdminRouter.get(
  "/:id/projects",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const items = await prisma.clientProject.findMany({
      where: { userId: id },
      orderBy: [{ createdAt: "desc" }],
    });
    res.json({ items });
  }),
);

usersAdminRouter.post(
  "/:id/projects",
  canManage,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(projectSchema, req.body);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    const project = await prisma.clientProject.create({
      data: {
        userId: id,
        name: data.name,
        description: data.description ?? null,
        status: data.status,
        progress: data.progress,
        dueDate: data.dueDate ?? null,
      },
    });
    await recordAudit({
      ...actor(req),
      action: "project.create",
      targetType: "ClientProject",
      targetId: project.id,
      metadata: { userId: id },
    });
    res.status(201).json({ project });
  }),
);

usersAdminRouter.patch(
  "/projects/:projectId",
  canManage,
  asyncHandler(async (req, res) => {
    const { id: projectId } = parseBody(idParamSchema, { id: req.params.projectId });
    const data = parseBody(projectUpdateSchema, req.body);
    const project = await prisma.clientProject.update({
      where: { id: projectId },
      data: {
        name: data.name ?? undefined,
        description: data.description === undefined ? undefined : data.description,
        status: data.status ?? undefined,
        progress: data.progress ?? undefined,
        dueDate: data.dueDate === undefined ? undefined : data.dueDate,
      },
    });
    await recordAudit({
      ...actor(req),
      action: "project.update",
      targetType: "ClientProject",
      targetId: projectId,
    });
    res.json({ project });
  }),
);

usersAdminRouter.delete(
  "/projects/:projectId",
  canManage,
  asyncHandler(async (req, res) => {
    const { id: projectId } = parseBody(idParamSchema, { id: req.params.projectId });
    await prisma.clientProject.delete({ where: { id: projectId } });
    await recordAudit({
      ...actor(req),
      action: "project.delete",
      targetType: "ClientProject",
      targetId: projectId,
    });
    res.json({ ok: true });
  }),
);
