import { Router } from "express";
import { logger } from "../logger";
import { getProviderInfo, applyVerifiedEvent, verifyWebhookSignature } from "../services/paymentService";
import { prisma } from "../db";

export const webhookRouter = Router();

function extractEventId(
  provider: string,
  headers: Record<string, string | string[] | undefined>,
  body: Record<string, unknown>,
): string | null {
  if (provider === "stripe") {
    return typeof body.id === "string" ? body.id : null;
  }
  if (provider === "razorpay") {
    const header = headers["x-razorpay-event-id"];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    if (fromHeader) return fromHeader;
    const event = body.event as Record<string, unknown> | undefined;
    return typeof event?.id === "string" ? event.id : null;
  }
  return null;
}

function extractType(provider: string, body: Record<string, unknown>): string {
  if (provider === "stripe") return typeof body.type === "string" ? body.type : "unknown";
  if (provider === "razorpay") {
    const event = body.event as Record<string, unknown> | undefined;
    return typeof event?.type === "string" ? event.type : "unknown";
  }
  return "unknown";
}

function extractTxnId(provider: string, body: Record<string, unknown>): string | null {
  try {
    if (provider === "stripe") {
      const data = body.data as { object?: Record<string, unknown> } | undefined;
      const obj = data?.object;
      if (!obj) return null;
      if (typeof obj.id === "string" && String(body.type).startsWith("payment_intent")) return obj.id;
      if (typeof obj.payment_intent === "string") return obj.payment_intent;
      if (typeof obj.id === "string") return obj.id;
      return null;
    }
    if (provider === "razorpay") {
      const payload = body.payload as { payment?: { entity?: { id?: string } } } | undefined;
      return payload?.payment?.entity?.id ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

webhookRouter.post("/payments", async (req, res) => {
  const { provider, demoMode } = getProviderInfo();
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? ""));

  if (provider === "none" || demoMode) {
    res.status(200).json({ received: true, ignored: true, reason: "No live payment provider configured" });
    return;
  }

  const signatureValid = verifyWebhookSignature(rawBody, req.headers);
  if (!signatureValid) {
    logger.warn({ provider }, "rejected payment webhook: invalid signature");
    res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Signature verification failed" } });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: { code: "BAD_JSON", message: "Invalid JSON payload" } });
    return;
  }

  const providerEventId = extractEventId(provider, req.headers, body);
  const type = extractType(provider, body);
  if (!providerEventId) {
    res.status(400).json({ error: { code: "MISSING_EVENT_ID", message: "Missing event id" } });
    return;
  }

  const txnId = extractTxnId(provider, body);
  let paymentId: string | null = null;
  if (txnId) {
    const payment = await prisma.payment.findFirst({ where: { provider, providerTxnId: txnId } });
    paymentId = payment?.id ?? null;
  }

  const result = await applyVerifiedEvent({
    providerEventId,
    provider,
    type,
    payload: body,
    paymentId,
  });

  logger.info(
    { provider, type, providerEventId, duplicate: result.duplicate, paymentId },
    "processed payment webhook",
  );

  res.json({ received: true, duplicate: result.duplicate, status: result.status });
});
