import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PAYMENT_CLASSES,
  PAYMENT_LABELS,
  type PaymentStatus,
} from "../../lib/status";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon ? <span className="text-accent">{icon}</span> : null}
      </div>
      <p className="mt-2 stat-value">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return <span className={PAYMENT_CLASSES[status]}>{PAYMENT_LABELS[status]}</span>;
}

export function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm">
      <p className="text-muted">
        Page {page} of {pageCount} · {total} record{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Prev
        </button>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="card overflow-hidden">{children}</div>;
}
