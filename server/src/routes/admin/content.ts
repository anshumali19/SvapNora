import { Router } from "express";
import { ApiError, asyncHandler, parseBody, parseQuery } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { prisma } from "../../db";
import { recordAudit } from "../../services/auditService";
import {
  companyPageSchema,
  featureSchema,
  idParamSchema,
  milestoneSchema,
  paginationSchema,
  roadmapItemSchema,
} from "../../validation/schemas";

export const contentAdminRouter = Router();

const canRead = requirePermission("content.read");
const canWrite = requirePermission("content.write");

function actor(req: import("express").Request) {
  return { actorId: req.admin!.user.id, actorEmail: req.admin!.user.email, ip: req.ip };
}

// --- Company pages -----------------------------------------------------------

contentAdminRouter.get(
  "/pages",
  canRead,
  asyncHandler(async (req, res) => {
    const { page, pageSize } = parseQuery(paginationSchema, req.query);
    const [total, items] = await Promise.all([
      prisma.companyPage.count(),
      prisma.companyPage.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json({ items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

contentAdminRouter.post(
  "/pages",
  canWrite,
  asyncHandler(async (req, res) => {
    const data = parseBody(companyPageSchema, req.body);
    const created = await prisma.companyPage.create({
      data: {
        slug: data.slug,
        title: data.title,
        summary: data.summary ?? null,
        body: data.body as never,
        status: data.status,
        updatedBy: req.admin!.user.id,
      },
    });
    await recordAudit({ ...actor(req), action: "content.page.create", targetType: "CompanyPage", targetId: created.id });
    res.status(201).json({ page: created });
  }),
);

contentAdminRouter.put(
  "/pages/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(companyPageSchema.partial(), req.body);
    const existing = await prisma.companyPage.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Page not found");
    const updated = await prisma.companyPage.update({
      where: { id },
      data: {
        slug: data.slug ?? undefined,
        title: data.title ?? undefined,
        summary: data.summary ?? undefined,
        body: (data.body ?? undefined) as never,
        status: data.status ?? undefined,
        updatedBy: req.admin!.user.id,
      },
    });
    await recordAudit({ ...actor(req), action: "content.page.update", targetType: "CompanyPage", targetId: id });
    res.json({ page: updated });
  }),
);

contentAdminRouter.delete(
  "/pages/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    await prisma.companyPage.delete({ where: { id } });
    await recordAudit({ ...actor(req), action: "content.page.delete", targetType: "CompanyPage", targetId: id });
    res.json({ ok: true });
  }),
);

// --- GlowLang features -------------------------------------------------------

contentAdminRouter.get(
  "/features",
  canRead,
  asyncHandler(async (_req, res) => {
    const items = await prisma.glowLangFeature.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
    res.json({ items });
  }),
);

contentAdminRouter.post(
  "/features",
  canWrite,
  asyncHandler(async (req, res) => {
    const data = parseBody(featureSchema, req.body);
    const created = await prisma.glowLangFeature.create({ data });
    await recordAudit({ ...actor(req), action: "content.feature.create", targetType: "GlowLangFeature", targetId: created.id });
    res.status(201).json({ feature: created });
  }),
);

contentAdminRouter.put(
  "/features/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(featureSchema.partial(), req.body);
    const updated = await prisma.glowLangFeature.update({ where: { id }, data });
    await recordAudit({ ...actor(req), action: "content.feature.update", targetType: "GlowLangFeature", targetId: id });
    res.json({ feature: updated });
  }),
);

contentAdminRouter.delete(
  "/features/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    await prisma.glowLangFeature.delete({ where: { id } });
    await recordAudit({ ...actor(req), action: "content.feature.delete", targetType: "GlowLangFeature", targetId: id });
    res.json({ ok: true });
  }),
);

// --- Company milestones ------------------------------------------------------

contentAdminRouter.get(
  "/milestones",
  canRead,
  asyncHandler(async (_req, res) => {
    const items = await prisma.companyMilestone.findMany({ orderBy: [{ sortOrder: "asc" }] });
    res.json({ items });
  }),
);

contentAdminRouter.post(
  "/milestones",
  canWrite,
  asyncHandler(async (req, res) => {
    const data = parseBody(milestoneSchema, req.body);
    const created = await prisma.companyMilestone.create({ data });
    await recordAudit({ ...actor(req), action: "content.milestone.create", targetType: "CompanyMilestone", targetId: created.id });
    res.status(201).json({ milestone: created });
  }),
);

contentAdminRouter.put(
  "/milestones/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(milestoneSchema.partial(), req.body);
    const updated = await prisma.companyMilestone.update({ where: { id }, data });
    await recordAudit({ ...actor(req), action: "content.milestone.update", targetType: "CompanyMilestone", targetId: id });
    res.json({ milestone: updated });
  }),
);

contentAdminRouter.delete(
  "/milestones/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    await prisma.companyMilestone.delete({ where: { id } });
    await recordAudit({ ...actor(req), action: "content.milestone.delete", targetType: "CompanyMilestone", targetId: id });
    res.json({ ok: true });
  }),
);

// --- Roadmap -----------------------------------------------------------------

contentAdminRouter.get(
  "/roadmap",
  canRead,
  asyncHandler(async (_req, res) => {
    const items = await prisma.roadmapItem.findMany({ orderBy: [{ sortOrder: "asc" }] });
    res.json({ items });
  }),
);

contentAdminRouter.post(
  "/roadmap",
  canWrite,
  asyncHandler(async (req, res) => {
    const data = parseBody(roadmapItemSchema, req.body);
    const created = await prisma.roadmapItem.create({ data });
    await recordAudit({ ...actor(req), action: "content.roadmap.create", targetType: "RoadmapItem", targetId: created.id });
    res.status(201).json({ item: created });
  }),
);

contentAdminRouter.put(
  "/roadmap/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(roadmapItemSchema.partial(), req.body);
    const updated = await prisma.roadmapItem.update({ where: { id }, data });
    await recordAudit({ ...actor(req), action: "content.roadmap.update", targetType: "RoadmapItem", targetId: id });
    res.json({ item: updated });
  }),
);

contentAdminRouter.delete(
  "/roadmap/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    await prisma.roadmapItem.delete({ where: { id } });
    await recordAudit({ ...actor(req), action: "content.roadmap.delete", targetType: "RoadmapItem", targetId: id });
    res.json({ ok: true });
  }),
);
