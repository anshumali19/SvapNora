import { Router } from "express";
import { asyncHandler, ApiError } from "../lib/http";
import { prisma } from "../db";
import { getProviderInfo } from "../services/paymentService";

export const contentRouter = Router();

const PUBLISHED = { status: "PUBLISHED" as const };

contentRouter.get(
  "/pages/:slug",
  asyncHandler(async (req, res) => {
    const page = await prisma.companyPage.findFirst({
      where: { slug: req.params.slug, ...PUBLISHED },
    });
    if (!page) throw ApiError.notFound("Page not found");
    res.json({ page });
  }),
);

contentRouter.get(
  "/features",
  asyncHandler(async (_req, res) => {
    const features = await prisma.glowLangFeature.findMany({
      where: { isPublished: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    res.json({ features });
  }),
);

contentRouter.get(
  "/milestones",
  asyncHandler(async (_req, res) => {
    const milestones = await prisma.companyMilestone.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }],
    });
    res.json({ milestones });
  }),
);

contentRouter.get(
  "/roadmap",
  asyncHandler(async (_req, res) => {
    const items = await prisma.roadmapItem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }],
    });
    res.json({ items });
  }),
);

contentRouter.get(
  "/payments/status",
  asyncHandler(async (_req, res) => {
    const info = getProviderInfo();
    res.json({
      provider: info.provider,
      currency: info.currency,
      demoMode: info.demoMode,
      configured: info.configured,
    });
  }),
);
