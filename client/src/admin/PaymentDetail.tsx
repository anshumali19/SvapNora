import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { adminApi, type PaymentStatus } from "./api";
import { useAdminAuth } from "./AdminAuthProvider";
import { PageHeader, PaymentStatusPill } from "./components/AdminUI";
import { LoadingBlock } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { PAYMENT_LABELS } from "../lib/status";

interface Detail {
  id: string;
  provider: string;
  providerTxnId: string;
  customerName: string | null;
  customerEmail: string | null;
  orderRef: string | null;
  amountFormatted: string;
  amountMinor: string;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  refundedFormatted: string;
  refundedAmountMinor: string;
  reconciliation: string;
  createdAt: string;
  updatedAt: string;
  events: Array<{ id: string; type: string; providerEventId: string; signatureValid: boolean; receivedAt: string }>;
  refunds: Array<{ id: string; amountFormatted: string; status: string; reason: string | null; createdAt: string }>;
}

const STATUSES: PaymentStatus[] = [
  "PENDING",
  "SUCCESSFUL",
  "FAILED",
  "CANCELLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

export default function PaymentDetail() {
  const { id = "" } = useParams();
  const { can } = useAdminAuth();
  const { push } = useToast();
  const [payment, setPayment] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminApi.payments
      .get(id)
      .then((d) => setPayment(d.payment as unknown as Detail))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(next: PaymentStatus) {
    setSaving(true);
    try {
      await adminApi.payments.update(id, { status: next });
      push({ variant: "success", title: "Payment status updated" });
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-danger">{error}</p>
        <Link to="/admin/payments" className="btn-secondary btn-sm mt-4">
          Back to payments
        </Link>
      </div>
    );
  }
  if (!payment) return <LoadingBlock label="Loading payment…" />;

  const rows: Array<[string, string]> = [
    ["Internal ID", payment.id],
    ["Provider", payment.provider],
    ["Provider transaction ID", payment.providerTxnId],
    ["Customer", payment.customerName ?? "—"],
    ["Customer email", payment.customerEmail ?? "—"],
    ["Order reference", payment.orderRef ?? "—"],
    ["Amount", `${payment.amountFormatted} (${payment.amountMinor} minor units, ${payment.currency})`],
    ["Method", payment.method ?? "—"],
    ["Refunded", `${payment.refundedFormatted} (${payment.refundedAmountMinor})`],
    ["Reconciliation", payment.reconciliation],
    ["Created", formatDateTime(payment.createdAt)],
    ["Updated", formatDateTime(payment.updatedAt)],
  ];

  return (
    <div>
      <Link to="/admin/payments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to payments
      </Link>

      <PageHeader
        title={payment.providerTxnId}
        description={`Payment record ${payment.id}`}
        actions={<PaymentStatusPill status={payment.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Record</h2>
          <dl className="divide-y divide-line/60">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[200px_1fr]">
                <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
                <dd className="break-words text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Current state</h2>
            {can("payments.write") ? (
              <div>
                <label htmlFor="pd-status" className="label">
                  Update status
                </label>
                <select
                  id="pd-status"
                  className="input"
                  value={payment.status}
                  disabled={saving}
                  onChange={(e) => updateStatus(e.target.value as PaymentStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PAYMENT_LABELS[s]}
                    </option>
                  ))}
                </select>
                <p className="hint mt-2">
                  Manual changes are audited. With a live provider, status should reflect verified
                  provider events rather than manual edits.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Your role can view but not modify payment records.</p>
            )}
            <button type="button" onClick={load} className="btn-ghost btn-sm mt-3">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </button>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Refunds</h2>
            {payment.refunds.length === 0 ? (
              <p className="text-sm text-muted">No refunds recorded.</p>
            ) : (
              <ul className="space-y-2">
                {payment.refunds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{r.amountFormatted}</span>
                    <span className="text-xs text-muted">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold">Transaction events</h2>
        {payment.events.length === 0 ? (
          <p className="text-sm text-muted">
            No provider events recorded for this payment. Events are stored from verified webhooks.
          </p>
        ) : (
          <ol className="relative space-y-3 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-line">
            {payment.events.map((ev) => (
              <li key={ev.id} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                <p className="text-sm font-medium text-ink">{ev.type}</p>
                <p className="text-xs text-muted">
                  {ev.providerEventId} · {formatDateTime(ev.receivedAt)} ·{" "}
                  {ev.signatureValid ? "signature valid" : "unverified"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
