import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Mail,
  FileText,
  Route,
  TrendingUp,
  CircleDollarSign,
  AlertTriangle,
} from "lucide-react";
import { adminApi, type OverviewData } from "./api";
import { PageHeader, PaymentStatusPill, StatCard } from "./components/AdminUI";
import { LoadingBlock } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDateTime, formatMinor } from "../lib/format";
import { ApiError } from "../lib/api";

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
      .overview()
      .then((d) => active && setData(d))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Failed to load"));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }
  if (!data) return <LoadingBlock label="Loading overview…" />;

  const byStatus = data.payments.byStatus;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A live snapshot of records stored in the SvapNora database."
      />

      {data.provider.demoMode ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Payments are running in <strong>demo mode</strong> (no live payment provider configured).
            Records labelled <code>demo</code> are illustrative and do not represent real revenue.
            Configure a provider to process live payments.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total payments" value={data.payments.total} icon={<CreditCard className="h-4 w-4" aria-hidden />} />
        <StatCard
          label="Successful"
          value={byStatus.SUCCESSFUL ?? 0}
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        />
        <StatCard label="Pending" value={byStatus.PENDING ?? 0} />
        <StatCard label="Failed" value={byStatus.FAILED ?? 0} />
        <StatCard
          label="Refunded"
          value={(byStatus.REFUNDED ?? 0) + (byStatus.PARTIALLY_REFUNDED ?? 0)}
        />
        <StatCard
          label="Refunded total"
          value={formatMinor(data.payments.refundedTotalMinor, data.provider.currency)}
          icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Messages"
          value={data.contacts.total}
          hint={`${data.contacts.unread} unread`}
          icon={<Mail className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Content pages"
          value={data.content.pages}
          hint={`${data.content.published} published · ${data.content.draft} draft`}
          icon={<FileText className="h-4 w-4" aria-hidden />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent transactions</h2>
            <Link to="/admin/payments" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {data.payments.recent.length === 0 ? (
            <EmptyState
              title="No payment records yet"
              description="Records will appear here once payments exist, or when demo mode is seeded."
            />
          ) : (
            <div className="card divide-y divide-line/60 overflow-hidden">
              {data.payments.recent.map((p) => (
                <Link
                  key={p.id}
                  to={`/admin/payments/${p.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-2/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.providerTxnId}</p>
                    <p className="truncate text-xs text-muted">
                      {p.customerEmail ?? p.orderRef ?? p.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink">{p.amountFormatted}</p>
                    <PaymentStatusPill status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent messages</h2>
            <Link to="/admin/contact" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {data.contacts.recent.length === 0 ? (
            <EmptyState title="No messages yet" description="Contact submissions will appear here." />
          ) : (
            <div className="card divide-y divide-line/60 overflow-hidden">
              {data.contacts.recent.map((c) => (
                <Link
                  key={c.id}
                  to="/admin/contact"
                  className="block px-4 py-3 text-sm hover:bg-surface-2/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium text-ink">{c.subject}</p>
                    <span className="shrink-0 text-xs text-muted">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {c.name} · {c.email}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="GlowLang features" value={data.content.features} />
        <StatCard label="Milestones" value={data.content.milestones} />
        <StatCard
          label="Roadmap items"
          value={data.content.roadmapItems}
          icon={<Route className="h-4 w-4" aria-hidden />}
        />
      </div>
    </div>
  );
}
