import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, UserCheck } from "lucide-react";
import { adminApi } from "./api";
import type { AdminRole } from "./AdminAuthProvider";
import { PageHeader, TableShell } from "./components/AdminUI";
import { Dialog } from "../components/ui/Dialog";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";

interface AdminRecord {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLES: AdminRole[] = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

export default function Admins() {
  const { push } = useToast();
  const [items, setItems] = useState<AdminRecord[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    adminApi.admins
      .list()
      .then((d) => setItems(d.items as AdminRecord[]))
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(id: string, body: unknown) {
    try {
      await adminApi.admins.update(id, body);
      push({ variant: "success", title: "Administrator updated" });
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
    }
  }

  async function revoke(id: string) {
    try {
      await adminApi.admins.revoke(id);
      push({ variant: "success", title: "Sessions revoked" });
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed" });
    }
  }

  if (!items) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Administrators"
        description="Provisioned administrators and their roles. There is no public registration."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add administrator
          </button>
        }
      />

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold">Last login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-ink">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input py-1.5 text-xs"
                      value={a.role}
                      onChange={(e) => update(a.id, { role: e.target.value as AdminRole })}
                      aria-label={`Role for ${a.name}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => update(a.id, { isActive: !a.isActive })}
                      className={a.isActive ? "badge-implemented" : "badge-research"}
                    >
                      {a.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(a.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-ghost btn-sm" onClick={() => revoke(a.id)} title="Revoke sessions">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <CreateAdminDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />
    </div>
  );
}

function CreateAdminDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("VIEWER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Use a password of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.admins.create({ email, name, password, role });
      push({ variant: "success", title: "Administrator created" });
      setEmail("");
      setName("");
      setPassword("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create administrator");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add administrator"
      footer={
        <>
          <button className="btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary btn-sm" type="submit" form="admin-create" disabled={submitting}>
            {submitting ? <Spinner className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" aria-hidden />}
            Create
          </button>
        </>
      }
    >
      <form id="admin-create" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="hint mt-1">Hashed with Argon2id before storage. Minimum 10 characters.</p>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
