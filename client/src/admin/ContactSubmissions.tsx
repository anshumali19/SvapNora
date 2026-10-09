import { useCallback, useEffect, useState } from "react";
import { Mail, Search } from "lucide-react";
import { adminApi, type ContactSubmission, type Paginated } from "./api";
import { useAdminAuth } from "./AdminAuthProvider";
import { PageHeader, Pagination, TableShell } from "./components/AdminUI";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";

const STATUS_CLASSES: Record<string, string> = {
  NEW: "badge border-accent/40 bg-accent/10 text-accent",
  READ: "badge border-line bg-surface-2 text-muted",
  ARCHIVED: "badge border-line bg-surface-2 text-muted",
};

export default function ContactSubmissions() {
  const { can } = useAdminAuth();
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Paginated<ContactSubmission> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.contact
      .list({ page, pageSize: 20, status: status || undefined, search: search || undefined })
      .then(setData)
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function setSubmissionStatus(id: string, next: "NEW" | "READ" | "ARCHIVED") {
    try {
      await adminApi.contact.update(id, { status: next });
      push({ variant: "success", title: "Message updated" });
      setSelected(null);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
    }
  }

  return (
    <div>
      <PageHeader title="Messages" description="Contact form submissions received through the website." />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label htmlFor="msg-search" className="label">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="msg-search"
              className="input pl-9"
              placeholder="Name, email or subject"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="msg-status" className="label">
            Status
          </label>
          <select
            id="msg-status"
            className="input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon={<Mail className="h-6 w-6" />} title="No messages" description="Contact submissions will appear here." />
      ) : (
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Received</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-surface-2/40"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{c.email}</p>
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-ink">{c.subject}</td>
                    <td className="px-4 py-3 text-muted">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_CLASSES[c.status] ?? STATUS_CLASSES.READ}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(c.createdAt)}</td>
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

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? "Message"}
        size="lg"
        footer={
          can("contact.write") && selected ? (
            <>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setSubmissionStatus(selected.id, "ARCHIVED")}>
                Archive
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={() => setSubmissionStatus(selected.id, "READ")}>
                Mark as read
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted">Name:</span> {selected.name}</p>
              <p><span className="text-muted">Email:</span> {selected.email}</p>
              <p><span className="text-muted">Category:</span> {selected.category}</p>
              <p><span className="text-muted">Received:</span> {formatDateTime(selected.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/40 p-4 text-sm whitespace-pre-wrap text-ink">
              {selected.message}
            </div>
            <a href={`mailto:${selected.email}`} className="btn-secondary btn-sm inline-flex">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Reply by email
            </a>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
