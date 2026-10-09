import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, KeyRound, FolderKanban } from "lucide-react";
import { useUserAuth } from "./UserAuthProvider";
import { accountApi, type ClientProject, type ProjectStatus } from "../lib/accountApi";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { formatDate } from "../lib/format";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  COMPLETED: "Completed",
  ON_HOLD: "On hold",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  PLANNED: "badge border-line bg-surface-2 text-muted",
  IN_PROGRESS: "badge border-accent/40 bg-accent/10 text-accent",
  REVIEW: "badge border-amber-400/40 bg-amber-400/10 text-amber-500",
  COMPLETED: "badge border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  ON_HOLD: "badge border-danger/40 bg-danger/10 text-danger",
};

export default function Dashboard() {
  const { user, setUser, logout } = useUserAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ClientProject[] | null>(null);

  const load = useCallback(() => {
    accountApi
      .me()
      .then((data) => {
        setUser(data.user);
        setProjects(data.projects);
      })
      .catch((err) => push({ variant: "error", title: err instanceof ApiError ? err.message : "Failed to load" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onLogout() {
    await logout();
    navigate("/account/login", { replace: true });
  }

  if (!user) return <LoadingBlock />;

  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full border border-line bg-surface-2 p-2.5 text-accent">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted">Your SvapNora client portal</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="btn-secondary btn-sm">
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-6">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-accent" aria-hidden />
            <h2 className="text-lg font-semibold">Your projects</h2>
          </div>
          <div className="mt-4">
            {projects === null ? (
              <LoadingBlock label="Loading projects…" />
            ) : projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="When SvapNora starts work on an engagement, it will appear here with live progress."
              />
            ) : (
              <ul className="space-y-3">
                {projects.map((project) => (
                  <li key={project.id} className="rounded-xl border border-line bg-surface-2/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">{project.name}</p>
                      <span className={STATUS_CLASS[project.status]}>{STATUS_LABEL[project.status]}</span>
                    </div>
                    {project.description ? (
                      <p className="mt-2 text-sm text-muted">{project.description}</p>
                    ) : null}
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-muted">
                        <span>{project.progress}% complete</span>
                        {project.dueDate ? <span>Due {formatDate(project.dueDate)}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <ProfileCard />
          <PasswordCard />
        </div>
      </div>
    </div>
  );

  function ProfileCard() {
    const [name, setName] = useState(user!.name);
    const [company, setCompany] = useState(user!.company ?? "");
    const [saving, setSaving] = useState(false);

    async function save(e: FormEvent) {
      e.preventDefault();
      setSaving(true);
      try {
        const data = await accountApi.updateProfile({ name: name.trim(), company: company.trim() || null });
        setUser(data.user);
        push({ variant: "success", title: "Profile updated" });
      } catch (err) {
        push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
      } finally {
        setSaving(false);
      }
    }

    return (
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <form onSubmit={save} className="mt-4 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" value={user!.email} disabled />
            <p className="hint mt-1">Contact us to change the email on your account.</p>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary btn-sm w-full" disabled={saving}>
            {saving ? <Spinner className="h-3.5 w-3.5" /> : null}
            Save changes
          </button>
        </form>
      </section>
    );
  }

  function PasswordCard() {
    const [currentPassword, setCurrent] = useState("");
    const [newPassword, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);

    async function save(e: FormEvent) {
      e.preventDefault();
      if (newPassword.length < 10) {
        push({ variant: "error", title: "Use a password of at least 10 characters." });
        return;
      }
      if (newPassword !== confirm) {
        push({ variant: "error", title: "The passwords do not match." });
        return;
      }
      setSaving(true);
      try {
        await accountApi.changePassword({ currentPassword, newPassword });
        setCurrent("");
        setNext("");
        setConfirm("");
        push({ variant: "success", title: "Password changed", message: "Other sessions were signed out." });
      } catch (err) {
        push({ variant: "error", title: err instanceof ApiError ? err.message : "Update failed" });
      } finally {
        setSaving(false);
      }
    }

    return (
      <section className="panel p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" aria-hidden />
          <h2 className="text-lg font-semibold">Change password</h2>
        </div>
        <form onSubmit={save} className="mt-4 space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm w-full" disabled={saving}>
            {saving ? <Spinner className="h-3.5 w-3.5" /> : null}
            Update password
          </button>
        </form>
      </section>
    );
  }
}
