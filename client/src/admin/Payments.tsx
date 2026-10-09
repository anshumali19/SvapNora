import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Download, Plus, Search, Filter } from "lucide-react";
import { apiUrl, ApiError, apiRequest } from "../lib/api";
import { adminApi, type Paginated, type Payment, type PaymentStatus } from "./api";
import { useAdminAuth } from "./AdminAuthProvider";
import { PageHeader, Pagination, PaymentStatusPill, TableShell } from "./components/AdminUI";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { formatDate } from "../lib/format";
import { PAYMENT_LABELS } from "../lib/status";

const STATUSES: PaymentStatus[] = [
  "PENDING",
  "SUCCESSFUL",
  "FAILED",
  "CANCELLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

export default function Payments() {
  const { can } = useAdminAuth();
  const { push } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "amountMinor" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [data, setData] = useState<Paginated<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const params = {
    page,
    pageSize: 20,
    search: search || undefined,
    status: status || undefined,
    currency: currency || undefined,
    from: from || undefined,
    to: to || undefined,
    sortBy,
    sortDir,
  };

  const load = useCallback(() => {
    setLoading(true);
    adminApi.payments
      .list(params)
      .then(setData)
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load payments" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, currency, from, to, sortBy, sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(column: typeof sortBy) {
    if (sortBy === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDir("desc");
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Recorded transactions with status, refunds and reconciliation state."
        actions={
          <>
            {can("payments.export") ? (
              <a
                className="btn-secondary btn-sm"
                href={apiUrl(adminApi.payments.exportUrl(params))}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Export CSV
              </a>
            ) : null}
            {can("payments.write") ? (
              <button type="button" className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add record
              </button>
            ) : null}
          </>
        }
      />

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="pay-search" className="label">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="pay-search"
                className="input pl-9"
                placeholder="Transaction ID, email, order…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pay-status" className="label">
              Status
            </label>
            <select
              id="pay-status"
              className="input"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pay-currency" className="label">
              Currency
            </label>
            <input
              id="pay-currency"
              className="input"
              placeholder="e.g. USD"
              maxLength={3}
              value={currency}
              onChange={(e) => {
                setPage(1);
                setCurrency(e.target.value.toUpperCase());
              }}
            />
          </div>
          <div>
            <label htmlFor="pay-from" className="label">
              From
            </label>
            <input
              id="pay-from"
              type="date"
              className="input"
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="pay-to" className="label">
              To
            </label>
            <input
              id="pay-to"
              type="date"
              className="input"
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setStatus("");
                setCurrency("");
                setFrom("");
                setTo("");
                setPage(1);
              }}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Reset filters
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No payment records"
          description="No transactions match the current filters. In demo mode you can add an illustrative record."
        />
      ) : (
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Transaction</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <button type="button" onClick={() => toggleSort("amountMinor")} className="inline-flex items-center gap-1 hover:text-ink">
                      Amount
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-ink">
                      Status
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort("createdAt")} className="inline-flex items-center gap-1 hover:text-ink">
                      Created
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/payments/${p.id}`} className="font-medium text-ink hover:text-accent">
                        {p.providerTxnId}
                      </Link>
                      <p className="text-xs text-muted">{p.provider}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{p.customerName ?? "—"}</p>
                      <p className="text-xs text-muted">{p.customerEmail ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.orderRef ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {p.amountFormatted}
                      <p className="text-xs text-muted">{p.currency}</p>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data ? (
            <Pagination page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />
          ) : null}
        </TableShell>
      )}

      <CreatePaymentDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          setPage(1);
          load();
        }}
      />
    </div>
  );
}

function CreatePaymentDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { push } = useToast();
  const [amount, setAmount] = useState("10.00");
  const [currency, setCurrency] = useState("USD");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d+(\.\d{1,4})?$/.test(amount)) {
      setError("Enter a valid positive amount.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/admin/payments", {
        method: "POST",
        body: {
          amount,
          currency,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          orderRef: orderRef || undefined,
          status,
        },
      });
      push({ variant: "success", title: "Payment record created" });
      onCreated();
      setAmount("10.00");
      setCustomerName("");
      setCustomerEmail("");
      setOrderRef("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add payment record"
      footer={
        <>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="create-payment" className="btn-primary btn-sm" disabled={submitting}>
            {submitting ? <Spinner className="h-3.5 w-3.5" /> : null}
            Create record
          </button>
        </>
      }
    >
      <form id="create-payment" onSubmit={submit} className="space-y-4">
        <p className="rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-muted">
          In demo mode a synthetic provider transaction ID is generated. When a live provider is
          configured, records must originate from verified provider events instead.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cp-amount" className="label">
              Amount
            </label>
            <input id="cp-amount" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label htmlFor="cp-currency" className="label">
              Currency
            </label>
            <input
              id="cp-currency"
              className="input"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <div>
          <label htmlFor="cp-name" className="label">
            Customer name (optional)
          </label>
          <input id="cp-name" className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cp-email" className="label">
            Customer email (optional)
          </label>
          <input id="cp-email" type="email" className="input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cp-order" className="label">
              Order reference (optional)
            </label>
            <input id="cp-order" className="input" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cp-status" className="label">
              Status
            </label>
            <select id="cp-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
