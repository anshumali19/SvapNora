import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { adminApi, type AuditEntry, type Paginated } from "./api";
import { PageHeader, Pagination, TableShell } from "./components/AdminUI";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock } from "../components/ui/Spinner";
import { formatDateTime } from "../lib/format";

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.audit
      .list({ page, pageSize: 25 })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="A server-side record of important administrative actions."
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title="No audit entries"
          description="Administrative actions such as sign-ins, edits and exports will appear here."
        />
      ) : (
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-line/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-3 text-ink">{entry.actorEmail ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-accent">{entry.action}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.targetType ? `${entry.targetType}${entry.targetId ? `:${entry.targetId.slice(0, 8)}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{entry.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />
        </TableShell>
      )}
    </div>
  );
}
