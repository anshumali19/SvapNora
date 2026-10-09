import { Router } from "express";
import { asyncHandler, parseQuery } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { prisma } from "../../db";
import { paginationSchema } from "../../validation/schemas";

export const auditAdminRouter = Router();

auditAdminRouter.get(
  "/",
  requirePermission("audit.read"),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = parseQuery(paginationSchema, req.query);
    const [total, items] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json({ items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);
