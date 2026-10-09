import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FolderKanban, KeyRound, Plus, RotateCcw, Trash2, UserPlus } from "lucide-react";
import {
  adminApi,
  type AdminClientProject,
  type AdminProjectStatus,
  type ClientAccount,
  type ClientStatus,
  type Paginated,
} from "./api";
import { PageHeader, Pagination, TableShell } from "./components/AdminUI";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";

const STATUSES: ClientStatus[] = ["ACTIVE", "PENDING", "SUSPENDED"];
const PROJECT_STATUSES: AdminProjectStatus[] = ["PLANNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"];

const STATUS_CLASS: Record<ClientStatus, string> = {
  ACTIVE: "badge border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  PENDING: "badge border-amber-400/40 bg-amber-400/10 text-amber-500",
  SUSPENDED: "badge border-danger/40 bg-danger/10 text-danger",
};

export default function Clients() {
  const { push } = useToast();
  const [data, setData] = useState<Paginated<ClientAccount> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ClientStatus>("");
  const [showCreate, setShowCreate] = useState(false);
  const [projectsFor, setProjectsFor] = useState<ClientAccount | null>(null);

  const load = useCallback(() => {
    adminApi.clients
      .list({ page, pageSize: 20, search: search || undefined, status: status || undefined })
      .then(setData)
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(client: ClientAccount, next: ClientStatus) {
    try {
      await adminApi.clients.update(client.id, { status: next });
      push({ variant: "success", title: "Client updated" });
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
    }
  }

  async function revoke(client: ClientAccount) {
    try {
      await adminApi.clients.revoke(client.id);
      push({ variant: "success", title: "Sessions revoked" });
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  async function resetPassword(client: ClientAccount) {
    try {
      const res = await adminApi.clients.resetPassword(client.id);
      push({
        variant: "success",
        title: res.sent ? "Reset link emailed" : "Temporary password generated",
        message: res.sent ? undefined : `Share securely: ${res.temporaryPassword}`,
      });
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  async function remove(client: ClientAccount) {
    if (!window.confirm(`Delete the account for ${client.email}? This cannot be undone.`)) return;
    try {
      await adminApi.clients.remove(client.id);
      push({ variant: "success", title: "Client deleted" });
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Client portal accounts and their project workspaces. Provision accounts and manage deliverables."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add client
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search name, email or company…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input max-w-[12rem]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as "" | ClientStatus);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {!data ? (
        <LoadingBlock />
      ) : data.items.length === 0 ? (
        <EmptyState title="No clients found" description="Provision a client account to give them access to the portal." />
      ) : (
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-muted">{c.email}</td>
                    <td className="px-4 py-3 text-muted">{c.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input py-1.5 text-xs"
                        value={c.status}
                        onChange={(e) => updateStatus(c, e.target.value as ClientStatus)}
                        aria-label={`Status for ${c.name}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className={`${STATUS_CLASS[c.status]} ml-2 hidden`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(c.lastLoginAt ?? null)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => setProjectsFor(c)}
                          title="Manage projects"
                        >
                          <FolderKanban className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => resetPassword(c)} title="Reset password">
                          <KeyRound className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => revoke(c)} title="Revoke sessions">
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button className="btn-ghost btn-sm text-danger" onClick={() => remove(c)} title="Delete account">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} />
        </TableShell>
      )}

      <CreateClientDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />

      <ProjectsDialog client={projectsFor} onClose={() => setProjectsFor(null)} />
    </div>
  );
}

function CreateClientDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<ClientStatus>("ACTIVE");
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setCompany("");
    setPassword("");
    setStatus("ACTIVE");
    setSendInvite(true);
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password && password.length < 10) {
      setError("If set, the password must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminApi.clients.create({
        name: name.trim(),
        email: email.trim(),
        status,
        sendInvite,
        ...(company.trim() ? { company: company.trim() } : {}),
        ...(password ? { password } : {}),
      });
      push({
        variant: "success",
        title: "Client created",
        message: res.temporaryPassword ? `Temporary password: ${res.temporaryPassword}` : undefined,
      });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add client"
      footer={
        <>
          <button className="btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary btn-sm" type="submit" form="client-create" disabled={submitting}>
            {submitting ? <Spinner className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" aria-hidden />}
            Create
          </button>
        </>
      }
    >
      <form id="client-create" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Company (optional)</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="label">Password (optional)</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="hint mt-1">Leave blank to auto-generate a temporary password. Minimum 10 characters.</p>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-muted">
          <input type="checkbox" className="h-4 w-4" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
          <span>Email a welcome message (requires outbound email to be configured).</span>
        </label>
        {error ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

function ProjectsDialog({ client, onClose }: { client: ClientAccount | null; onClose: () => void }) {
  const { push } = useToast();
  const [projects, setProjects] = useState<AdminClientProject[] | null>(null);

  const load = useCallback(() => {
    if (!client) return;
    adminApi.clients
      .projects(client.id)
      .then((d) => setProjects(d.items))
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  useEffect(() => {
    if (client) load();
  }, [client, load]);

  async function addProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const due = String(form.get("dueDate") ?? "");
    const body = {
      name,
      description: String(form.get("description") ?? "").trim() || null,
      status: String(form.get("status") ?? "PLANNED"),
      progress: Number(form.get("progress") ?? 0),
      ...(due ? { dueDate: new Date(due).toISOString() } : {}),
    };
    try {
      await adminApi.clients.createProject(client.id, body);
      push({ variant: "success", title: "Project added" });
      e.currentTarget.reset();
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  async function update(project: AdminClientProject, body: unknown) {
    try {
      await adminApi.clients.updateProject(project.id, body);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  async function remove(project: AdminClientProject) {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    try {
      await adminApi.clients.deleteProject(project.id);
      push({ variant: "success", title: "Project deleted" });
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  return (
    <Dialog open={Boolean(client)} onClose={onClose} title={client ? `Projects · ${client.name}` : "Projects"}>
      {!projects ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p.id} className="rounded-xl border border-line bg-surface-2/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.description ? <p className="mt-0.5 text-xs text-muted">{p.description}</p> : null}
                    </div>
                    <button className="btn-ghost btn-sm text-danger" onClick={() => remove(p)} title="Delete project">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      className="input py-1.5 text-xs"
                      value={p.status}
                      onChange={(e) => update(p, { status: e.target.value })}
                      aria-label={`Status for ${p.name}`}
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input w-20 py-1.5 text-xs"
                      defaultValue={p.progress}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (value !== p.progress) update(p, { progress: value });
                      }}
                      aria-label={`Progress for ${p.name}`}
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addProject} className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-semibold text-ink">Add project</p>
            <input className="input" name="name" placeholder="Project name" required />
            <textarea className="input min-h-[64px]" name="description" placeholder="Description (optional)" />
            <div className="flex flex-wrap gap-2">
              <select className="input max-w-[12rem]" name="status" defaultValue="PLANNED" aria-label="Status">
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                className="input w-24"
                name="progress"
                type="number"
                min={0}
                max={100}
                defaultValue={0}
                aria-label="Progress percent"
              />
              <input className="input max-w-[12rem]" name="dueDate" type="date" aria-label="Due date" />
            </div>
            <button type="submit" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add project
            </button>
          </form>
        </div>
      )}
    </Dialog>
  );
}
