import crypto from "crypto";
import { describe, expect, it } from "vitest";
import type { Payment } from "@prisma/client";
import {
  mapEventToStatus,
  serializePayment,
  toCsv,
  verifyRazorpaySignature,
  verifyStripeSignature,
} from "../src/services/paymentService";

describe("webhook signature verification", () => {
  it("accepts a valid Stripe signature", () => {
    const secret = "whsec_test_123";
    const body = Buffer.from(JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" }));
    const t = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac("sha256", secret).update(`${t}.${body.toString("utf8")}`).digest("hex");
    expect(verifyStripeSignature(body, `t=${t},v1=${v1}`, secret)).toBe(true);
  });

  it("rejects a tampered Stripe signature", () => {
    const secret = "whsec_test_123";
    const body = Buffer.from("{}");
    expect(verifyStripeSignature(body, "t=1,v1=deadbeef", secret)).toBe(false);
    expect(verifyStripeSignature(body, undefined, secret)).toBe(false);
  });

  it("accepts and rejects Razorpay signatures", () => {
    const secret = "rzp_secret";
    const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true);
    expect(verifyRazorpaySignature(body, "wrong", secret)).toBe(false);
  });
});

describe("event status mapping", () => {
  it("maps known Stripe events", () => {
    expect(mapEventToStatus("stripe", "payment_intent.succeeded")).toBe("SUCCESSFUL");
    expect(mapEventToStatus("stripe", "payment_intent.payment_failed")).toBe("FAILED");
    expect(mapEventToStatus("stripe", "unknown.event")).toBeNull();
  });

  it("maps known Razorpay events", () => {
    expect(mapEventToStatus("razorpay", "payment.captured")).toBe("SUCCESSFUL");
    expect(mapEventToStatus("razorpay", "payment.failed")).toBe("FAILED");
  });
});

describe("payment serialization", () => {
  const payment = {
    id: "pay_1",
    provider: "demo",
    providerTxnId: "demo_1",
    customerName: "Demo",
    customerEmail: "demo@example.com",
    orderRef: "ORD-1",
    amountMinor: 4900n,
    currency: "USD",
    method: "demo-card",
    status: "SUCCESSFUL",
    refundedAmountMinor: 0n,
    reconciliation: "RECONCILED",
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Payment;

  it("serializes BigInt amounts to strings", () => {
    const s = serializePayment(payment);
    expect(s.amountMinor).toBe("4900");
    expect(s.refundedAmountMinor).toBe("0");
    expect(typeof s.amountFormatted).toBe("string");
  });

  it("produces CSV with a header row", () => {
    const csv = toCsv([serializePayment(payment)]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("providerTxnId");
    expect(lines[1]).toContain("demo_1");
  });
});
