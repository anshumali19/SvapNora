import crypto from "crypto";
import type { Payment, PaymentEvent, PaymentStatus, Prisma, Refund } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { ApiError } from "../lib/http";
import { formatMinor, normalizeCurrency } from "../lib/money";
import { logger } from "../logger";

export interface ProviderInfo {
  provider: string;
  demoMode: boolean;
  currency: string;
  configured: boolean;
}

export function getProviderInfo(): ProviderInfo {
  const provider = env.PAYMENT_PROVIDER;
  const configured =
    provider === "stripe"
      ? Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
      : provider === "razorpay"
        ? Boolean(env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET)
        : false;
  return {
    provider,
    demoMode: provider === "none" || env.PAYMENTS_DEMO_MODE || !configured,
    currency: normalizeCurrency(env.PAYMENTS_CURRENCY),
    configured,
  };
}

export type SerializedPayment = Omit<Payment, "amountMinor" | "refundedAmountMinor"> & {
  amountMinor: string;
  refundedAmountMinor: string;
  amountFormatted: string;
  refundedFormatted: string;
  refunds?: SerializedRefund[];
};

export type SerializedRefund = Omit<Refund, "amountMinor"> & {
  amountMinor: string;
  amountFormatted: string;
};

export function serializePayment(
  payment: Payment & { refunds?: Refund[] },
): SerializedPayment {
  return {
    ...payment,
    amountMinor: payment.amountMinor.toString(),
    refundedAmountMinor: payment.refundedAmountMinor.toString(),
    amountFormatted: formatMinor(payment.amountMinor, payment.currency),
    refundedFormatted: formatMinor(payment.refundedAmountMinor, payment.currency),
    refunds: payment.refunds?.map((r) => serializeRefund(r, payment.currency)),
  };
}

export function serializeRefund(refund: Refund, currency = getProviderInfo().currency): SerializedRefund {
  return {
    ...refund,
    amountMinor: refund.amountMinor.toString(),
    amountFormatted: formatMinor(refund.amountMinor, currency),
  };
}

export interface ListPaymentsParams {
  search?: string;
  status?: PaymentStatus;
  currency?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "amountMinor" | "status";
  sortDir: "asc" | "desc";
}

export async function listPayments(params: ListPaymentsParams) {
  const where: Prisma.PaymentWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.currency) where.currency = normalizeCurrency(params.currency);
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = params.from;
    if (params.to) where.createdAt.lte = params.to;
  }
  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { providerTxnId: { contains: q, mode: "insensitive" } },
      { orderRef: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);

  return {
    items: items.map((p) => serializePayment(p)),
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function getPayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { events: { orderBy: { receivedAt: "desc" } }, refunds: { orderBy: { createdAt: "desc" } } },
  });
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
}

export async function getPaymentSummary() {
  const [counts, recent, refundedAgg] = await Promise.all([
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.payment.aggregate({ _sum: { refundedAmountMinor: true } }),
  ]);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const row of counts) {
    byStatus[row.status] = row._count._all;
    total += row._count._all;
  }

  return {
    total,
    byStatus,
    recent: recent.map((p) => serializePayment(p)),
    refundedTotalMinor: (refundedAgg._sum.refundedAmountMinor ?? 0n).toString(),
  };
}

export interface CreatePaymentInput {
  providerTxnId?: string;
  customerName?: string | null;
  customerEmail?: string | null;
  orderRef?: string | null;
  amountMinor: bigint;
  currency: string;
  method?: string | null;
  status?: PaymentStatus;
  metadata?: Record<string, unknown> | null;
}

/** Create a payment record. In demo mode a synthetic txn id is generated. */
export async function createPayment(input: CreatePaymentInput) {
  const { demoMode, provider } = getProviderInfo();
  if (!demoMode && !input.providerTxnId) {
    throw ApiError.badRequest(
      "providerTxnId is required when not in demo mode; payments must originate from the provider.",
    );
  }
  const providerTxnId =
    input.providerTxnId ?? `demo_${crypto.randomBytes(9).toString("hex")}`;

  try {
    const payment = await prisma.payment.create({
      data: {
        provider: demoMode ? "demo" : provider,
        providerTxnId,
        customerName: input.customerName ?? null,
        customerEmail: input.customerEmail ?? null,
        orderRef: input.orderRef ?? null,
        amountMinor: input.amountMinor,
        currency: normalizeCurrency(input.currency),
        method: input.method ?? null,
        status: input.status ?? "PENDING",
        metadata: (input.metadata ?? undefined) as never,
      },
    });
    return payment;
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      throw ApiError.conflict("A payment with this provider transaction id already exists");
    }
    throw err;
  }
}

/** Update the current-state fields of a payment. */
export async function updatePayment(
  id: string,
  data: Partial<Pick<Payment, "status" | "customerName" | "customerEmail" | "orderRef" | "method" | "reconciliation">> & {
    refundedAmountMinor?: bigint;
  },
) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Payment not found");
  return prisma.payment.update({ where: { id }, data });
}

export interface RecordEventInput {
  providerEventId: string;
  provider: string;
  type: string;
  payload: unknown;
  signatureValid: boolean;
  paymentId?: string | null;
}

/**
 * Persist a provider event idempotently. If the same providerEventId has
 * already been recorded, the existing row is returned and `duplicate` is true
 * so the caller can skip reprocessing (webhook retry safety).
 */
export async function recordEvent(
  input: RecordEventInput,
): Promise<{ event: PaymentEvent; duplicate: boolean }> {
  const existing = await prisma.paymentEvent.findUnique({
    where: { providerEventId: input.providerEventId },
  });
  if (existing) return { event: existing, duplicate: true };

  try {
    const event = await prisma.paymentEvent.create({
      data: {
        providerEventId: input.providerEventId,
        provider: input.provider,
        type: input.type,
        payload: input.payload as never,
        signatureValid: input.signatureValid,
        paymentId: input.paymentId ?? null,
        processedAt: new Date(),
      },
    });
    return { event, duplicate: false };
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      const race = await prisma.paymentEvent.findUnique({
        where: { providerEventId: input.providerEventId },
      });
      if (race) return { event: race, duplicate: true };
    }
    throw err;
  }
}

// --- Provider signature verification -----------------------------------------

export function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const timestamp = parts["t"];
  const expected = parts["v1"];
  if (!timestamp || !expected) return false;
  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return safeEqual(computed, expected);
}

export function verifyRazorpaySignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(computed, signatureHeader);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const { provider } = getProviderInfo();
  if (provider === "stripe") {
    return verifyStripeSignature(
      rawBody,
      headerValue(headers["stripe-signature"]),
      env.STRIPE_WEBHOOK_SECRET,
    );
  }
  if (provider === "razorpay") {
    return verifyRazorpaySignature(
      rawBody,
      headerValue(headers["x-razorpay-signature"]),
      env.RAZORPAY_WEBHOOK_SECRET,
    );
  }
  return false;
}

function headerValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// --- Event → payment state mapping -------------------------------------------

const STRIPE_STATUS_MAP: Record<string, PaymentStatus> = {
  "payment_intent.succeeded": "SUCCESSFUL",
  "payment_intent.payment_failed": "FAILED",
  "payment_intent.canceled": "CANCELLED",
  "charge.refunded": "REFUNDED",
};

const RAZORPAY_STATUS_MAP: Record<string, PaymentStatus> = {
  "payment.captured": "SUCCESSFUL",
  "payment.authorized": "PENDING",
  "payment.failed": "FAILED",
  "refund.processed": "REFUNDED",
};

export function mapEventToStatus(provider: string, type: string): PaymentStatus | null {
  if (provider === "stripe") return STRIPE_STATUS_MAP[type] ?? null;
  if (provider === "razorpay") return RAZORPAY_STATUS_MAP[type] ?? null;
  return null;
}

/** Reconcile a payment against a freshly verified provider event. */
export async function applyVerifiedEvent(params: {
  providerEventId: string;
  provider: string;
  type: string;
  payload: Record<string, unknown>;
  paymentId?: string | null;
}): Promise<{ duplicate: boolean; status: PaymentStatus | null }> {
  const { duplicate } = await recordEvent({
    providerEventId: params.providerEventId,
    provider: params.provider,
    type: params.type,
    payload: params.payload,
    signatureValid: true,
    paymentId: params.paymentId ?? null,
  });

  if (duplicate) return { duplicate: true, status: null };

  const next = mapEventToStatus(params.provider, params.type);
  if (next && params.paymentId) {
    await prisma.payment
      .update({
        where: { id: params.paymentId },
        data: { status: next, reconciliation: "RECONCILED" },
      })
      .catch((err) => logger.error({ err }, "failed to apply payment status"));
  }
  return { duplicate: false, status: next };
}

export async function markReconciled(id: string): Promise<void> {
  await prisma.payment.update({ where: { id }, data: { reconciliation: "RECONCILED" } });
}

export function toCsv(rows: SerializedPayment[]): string {
  const header = [
    "id",
    "provider",
    "providerTxnId",
    "customerName",
    "customerEmail",
    "orderRef",
    "amountMinor",
    "amountFormatted",
    "currency",
    "method",
    "status",
    "refundedAmountMinor",
    "reconciliation",
    "createdAt",
    "updatedAt",
  ];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.provider,
        r.providerTxnId,
        r.customerName,
        r.customerEmail,
        r.orderRef,
        r.amountMinor,
        r.amountFormatted,
        r.currency,
        r.method,
        r.status,
        r.refundedAmountMinor,
        r.reconciliation,
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}
