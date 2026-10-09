import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler, parseBody, parseQuery } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { prisma } from "../../db";
import { recordAudit } from "../../services/auditService";
import { contactStatusSchema, idParamSchema, paginationSchema } from "../../validation/schemas";

export const contactAdminRouter = Router();

const canRead = requirePermission("contact.read");
const canWrite = requirePermission("contact.write");

contactAdminRouter.get(
  "/",
  canRead,
  asyncHandler(async (req, res) => {
    const { page, pageSize } = parseQuery(paginationSchema, req.query);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

    const where: Prisma.ContactSubmissionWhereInput = {};
    if (status && ["NEW", "READ", "ARCHIVED"].includes(status)) {
      where.status = status as Prisma.ContactSubmissionWhereInput["status"];
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.contactSubmission.count({ where }),
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json({ items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

contactAdminRouter.get(
  "/:id",
  canRead,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const submission = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!submission) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Submission not found" } });
      return;
    }
    await recordAudit({
      actorId: req.admin!.user.id,
      actorEmail: req.admin!.user.email,
      action: "contact.read.detail",
      targetType: "ContactSubmission",
      targetId: id,
      ip: req.ip,
    });
    res.json({ submission });
  }),
);

contactAdminRouter.patch(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const { status } = parseBody(contactStatusSchema, req.body);
    const updated = await prisma.contactSubmission.update({ where: { id }, data: { status } });
    await recordAudit({
      actorId: req.admin!.user.id,
      actorEmail: req.admin!.user.email,
      action: "contact.update",
      targetType: "ContactSubmission",
      targetId: id,
      metadata: { status },
      ip: req.ip,
    });
    res.json({ submission: updated });
  }),
);
