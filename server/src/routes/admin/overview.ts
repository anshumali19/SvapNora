import { Router } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../db";
import { getPaymentSummary, getProviderInfo } from "../../services/paymentService";

export const overviewAdminRouter = Router();

overviewAdminRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [
      paymentSummary,
      contactTotal,
      contactNew,
      recentContacts,
      pageCount,
      publishedPages,
      draftPages,
      featureCount,
      roadmapCount,
      milestoneCount,
    ] = await Promise.all([
      getPaymentSummary(),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: "NEW" } }),
      prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.companyPage.count(),
      prisma.companyPage.count({ where: { status: "PUBLISHED" } }),
      prisma.companyPage.count({ where: { status: "DRAFT" } }),
      prisma.glowLangFeature.count(),
      prisma.roadmapItem.count(),
      prisma.companyMilestone.count(),
    ]);

    res.json({
      payments: paymentSummary,
      provider: getProviderInfo(),
      contacts: { total: contactTotal, unread: contactNew, recent: recentContacts },
      content: {
        pages: pageCount,
        published: publishedPages,
        draft: draftPages,
        features: featureCount,
        milestones: milestoneCount,
        roadmapItems: roadmapCount,
      },
    });
  }),
);
