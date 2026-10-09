import { Router } from "express";
import { ApiError, asyncHandler, parseBody, parseQuery } from "../../lib/http";
import { requirePermission } from "../../middleware/auth";
import { toMinorUnits, normalizeCurrency } from "../../lib/money";
import { recordAudit } from "../../services/auditService";
import {
  createPayment,
  getPayment,
  getPaymentSummary,
  listPayments,
  serializePayment,
  toCsv,
  updatePayment,
} from "../../services/paymentService";
import {
  idParamSchema,
  paymentCreateSchema,
  paymentListQuerySchema,
  paymentUpdateSchema,
} from "../../validation/schemas";

export const paymentsAdminRouter = Router();

const canRead = requirePermission("payments.read");
const canWrite = requirePermission("payments.write");
const canExport = requirePermission("payments.export");

function actor(req: import("express").Request) {
  return { actorId: req.admin!.user.id, actorEmail: req.admin!.user.email, ip: req.ip };
}

paymentsAdminRouter.get(
  "/summary",
  canRead,
  asyncHandler(async (_req, res) => {
    res.json(await getPaymentSummary());
  }),
);

paymentsAdminRouter.get(
  "/export",
  canExport,
  asyncHandler(async (req, res) => {
    const query = parseQuery(paymentListQuerySchema, { ...req.query, page: 1, pageSize: 100 });
    const { items } = await listPayments({ ...query, page: 1, pageSize: 5000 });
    await recordAudit({
      ...actor(req),
      action: "payments.export",
      metadata: { count: items.length },
    });
    const csv = toCsv(items);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="svapnora-payments-${Date.now()}.csv"`);
    res.send(csv);
  }),
);

paymentsAdminRouter.get(
  "/",
  canRead,
  asyncHandler(async (req, res) => {
    const query = parseQuery(paymentListQuerySchema, req.query);
    res.json(await listPayments(query));
  }),
);

paymentsAdminRouter.get(
  "/:id",
  canRead,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const payment = await getPayment(id);
    await recordAudit({
      ...actor(req),
      action: "payments.read.detail",
      targetType: "Payment",
      targetId: id,
    });
    res.json({ payment: serializePayment(payment) });
  }),
);

paymentsAdminRouter.post(
  "/",
  canWrite,
  asyncHandler(async (req, res) => {
    const data = parseBody(paymentCreateSchema, req.body);
    const currency = normalizeCurrency(data.currency ?? "");
    if (!currency) throw ApiError.badRequest("currency is required (3-letter ISO code)");
    if (!data.amount) throw ApiError.badRequest("amount is required");
    const payment = await createPayment({
      providerTxnId: data.providerTxnId,
      customerName: data.customerName ?? null,
      customerEmail: data.customerEmail ?? null,
      orderRef: data.orderRef ?? null,
      amountMinor: toMinorUnits(data.amount, currency),
      currency,
      method: data.method ?? null,
      status: data.status,
    });
    await recordAudit({
      ...actor(req),
      action: "payments.create",
      targetType: "Payment",
      targetId: payment.id,
      metadata: { provider: payment.provider, currency },
    });
    res.status(201).json({ payment: serializePayment(payment) });
  }),
);

paymentsAdminRouter.patch(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const { id } = parseBody(idParamSchema, req.params);
    const data = parseBody(paymentUpdateSchema, req.body);
    const updated = await updatePayment(id, data);
    await recordAudit({
      ...actor(req),
      action: "payments.update",
      targetType: "Payment",
      targetId: id,
      metadata: { fields: Object.keys(data) },
    });
    res.json({ payment: serializePayment(updated) });
  }),
);
