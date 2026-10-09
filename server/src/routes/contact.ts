import { Router } from "express";
import { asyncHandler, parseBody } from "../lib/http";
import { contactLimiter } from "../middleware/rateLimit";
import { prisma } from "../db";
import { recordAudit } from "../services/auditService";
import { isEmailConfigured, sendContactNotification } from "../services/emailService";
import { contactSchema } from "../validation/schemas";

export const contactRouter = Router();

contactRouter.post(
  "/",
  contactLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(contactSchema, req.body);

    // Honeypot: silently accept (do not store) when filled by bots.
    if (input.company) {
      res.status(202).json({ received: true, emailed: false });
      return;
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        subject: input.subject,
        category: input.category,
        message: input.message,
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      },
    });

    const emailed = isEmailConfigured()
      ? await sendContactNotification({
          name: submission.name,
          email: submission.email,
          subject: submission.subject,
          category: submission.category,
          message: submission.message,
        })
      : false;

    await recordAudit({
      action: "contact.submitted",
      targetType: "ContactSubmission",
      targetId: submission.id,
      metadata: { emailed, category: submission.category },
      ip: req.ip,
    });

    res.status(201).json({
      received: true,
      emailed,
      id: submission.id,
      message: emailed
        ? "Thank you — your message has been received and emailed to the team."
        : "Thank you — your message was received and stored securely. Email delivery is not currently configured, so the team will follow up through the stored submission.",
    });
  }),
);
