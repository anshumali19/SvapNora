import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, type CapabilityStatus, type Feature, type Milestone, type RoadmapItem } from "./api";
import { useAdminAuth } from "./AdminAuthProvider";
import { PageHeader, TableShell } from "./components/AdminUI";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { ApiError } from "../lib/api";
import { CAPABILITY_LABELS } from "../lib/status";
import { formatDate } from "../lib/format";

type Tab = "features" | "milestones" | "roadmap" | "pages";

const STATUSES = Object.keys(CAPABILITY_LABELS) as CapabilityStatus[];

export default function Content() {
  const [tab, setTab] = useState<Tab>("features");
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "features", label: "GlowLang features" },
    { id: "milestones", label: "Milestones" },
    { id: "roadmap", label: "Roadmap" },
    { id: "pages", label: "Pages" },
  ];

  return (
    <div>
      <PageHeader title="Content" description="Manage the public site's features, milestones, roadmap and pages." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Content types">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "border-accent/60 bg-accent/10 text-ink" : "border-line bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "features" ? <FeatureManager /> : null}
      {tab === "milestones" ? <MilestoneManager /> : null}
      {tab === "roadmap" ? <RoadmapManager /> : null}
      {tab === "pages" ? <PageManager /> : null}
    </div>
  );
}

// --- Shared delete confirmation ---------------------------------------------

function useConfirm() {
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);
  const confirm = useCallback((action: () => Promise<void>) => {
    setPending(() => action);
  }, []);
  const dialog = (
    <Dialog
      open={Boolean(pending)}
      onClose={() => setPending(null)}
      title="Confirm deletion"
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={async () => {
              const action = pending;
              setPending(null);
              await action?.();
            }}
          >
            Delete
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">This action cannot be undone.</p>
    </Dialog>
  );
  return { confirm, dialog };
}

// --- Feature manager ---------------------------------------------------------

function FeatureManager() {
  const { can } = useAdminAuth();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Feature[] | null>(null);
  const [editing, setEditing] = useState<Partial<Feature> | null>(null);

  const load = useCallback(() => {
    adminApi.content.listFeatures().then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  const writable = can("content.write");

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const body = {
      category: editing.category ?? "",
      title: editing.title ?? "",
      description: editing.description ?? "",
      status: editing.status ?? "IMPLEMENTED",
      sortOrder: editing.sortOrder ?? 0,
      isPublished: editing.isPublished ?? true,
    };
    try {
      if (editing.id) await adminApi.content.updateFeature(editing.id, body);
      else await adminApi.content.createFeature(body);
      push({ variant: "success", title: "Feature saved" });
      setEditing(null);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    }
  }

  if (!items) return <LoadingBlock />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {writable ? (
          <button className="btn-primary btn-sm" onClick={() => setEditing({ status: "IMPLEMENTED", sortOrder: 0, isPublished: true })}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New feature
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState title="No features" description="Add GlowLang capabilities to display on the site." />
      ) : (
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-muted">{f.category}</td>
                    <td className="px-4 py-3 text-ink">{f.title}</td>
                    <td className="px-4 py-3 text-muted">{CAPABILITY_LABELS[f.status]}</td>
                    <td className="px-4 py-3 text-muted">{f.sortOrder}</td>
                    <td className="px-4 py-3 text-muted">{f.isPublished ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-right">
                      {writable ? (
                        <div className="flex justify-end gap-1">
                          <button className="btn-ghost btn-sm" onClick={() => setEditing(f)} aria-label={`Edit ${f.title}`}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            className="btn-ghost btn-sm text-danger"
                            aria-label={`Delete ${f.title}`}
                            onClick={() =>
                              confirm(async () => {
                                await adminApi.content.deleteFeature(f.id);
                                push({ variant: "success", title: "Feature deleted" });
                                load();
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit feature" : "New feature"}
        footer={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" type="submit" form="feature-form">
              Save
            </button>
          </>
        }
      >
        {editing ? (
          <form id="feature-form" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            </div>
            <TextField label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={editing.status ?? "IMPLEMENTED"} onChange={(e) => setEditing({ ...editing, status: e.target.value as CapabilityStatus })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {CAPABILITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Sort order"
                type="number"
                value={String(editing.sortOrder ?? 0)}
                onChange={(v) => setEditing({ ...editing, sortOrder: Number(v) })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isPublished ?? true} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
              Published
            </label>
          </form>
        ) : null}
      </Dialog>
      {dialog}
    </div>
  );
}

// --- Milestone manager -------------------------------------------------------

function MilestoneManager() {
  const { can } = useAdminAuth();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Milestone[] | null>(null);
  const [editing, setEditing] = useState<Partial<Milestone> | null>(null);
  const writable = can("content.write");

  const load = useCallback(() => {
    adminApi.content.listMilestones().then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const body = {
      phase: editing.phase ?? "",
      title: editing.title ?? "",
      description: editing.description ?? "",
      status: editing.status ?? "IMPLEMENTED",
      sortOrder: editing.sortOrder ?? 0,
      isPublished: editing.isPublished ?? true,
    };
    try {
      if (editing.id) await adminApi.content.updateMilestone(editing.id, body);
      else await adminApi.content.createMilestone(body);
      push({ variant: "success", title: "Milestone saved" });
      setEditing(null);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    }
  }

  if (!items) return <LoadingBlock />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {writable ? (
          <button className="btn-primary btn-sm" onClick={() => setEditing({ status: "IMPLEMENTED", sortOrder: 0, isPublished: true })}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New milestone
          </button>
        ) : null}
      </div>
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Phase</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-muted">{m.phase}</td>
                  <td className="px-4 py-3 text-ink">{m.title}</td>
                  <td className="px-4 py-3 text-muted">{CAPABILITY_LABELS[m.status]}</td>
                  <td className="px-4 py-3 text-muted">{m.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    {writable ? (
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setEditing(m)} aria-label={`Edit ${m.title}`}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          className="btn-ghost btn-sm text-danger"
                          aria-label={`Delete ${m.title}`}
                          onClick={() =>
                            confirm(async () => {
                              await adminApi.content.deleteMilestone(m.id);
                              push({ variant: "success", title: "Milestone deleted" });
                              load();
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit milestone" : "New milestone"}
        footer={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" type="submit" form="milestone-form">
              Save
            </button>
          </>
        }
      >
        {editing ? (
          <form id="milestone-form" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phase" value={editing.phase ?? ""} onChange={(v) => setEditing({ ...editing, phase: v })} />
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            </div>
            <TextField label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={editing.status ?? "IMPLEMENTED"} onChange={(e) => setEditing({ ...editing, status: e.target.value as CapabilityStatus })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {CAPABILITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Sort order" type="number" value={String(editing.sortOrder ?? 0)} onChange={(v) => setEditing({ ...editing, sortOrder: Number(v) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isPublished ?? true} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
              Published
            </label>
          </form>
        ) : null}
      </Dialog>
      {dialog}
    </div>
  );
}

// --- Roadmap manager ---------------------------------------------------------

function RoadmapManager() {
  const { can } = useAdminAuth();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [editing, setEditing] = useState<Partial<RoadmapItem> | null>(null);
  const writable = can("content.write");

  const load = useCallback(() => {
    adminApi.content.listRoadmap().then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const body = {
      category: editing.category ?? "",
      title: editing.title ?? "",
      description: editing.description ?? "",
      status: editing.status ?? "PLANNED",
      sortOrder: editing.sortOrder ?? 0,
      isPublished: editing.isPublished ?? true,
    };
    try {
      if (editing.id) await adminApi.content.updateRoadmap(editing.id, body);
      else await adminApi.content.createRoadmap(body);
      push({ variant: "success", title: "Roadmap item saved" });
      setEditing(null);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    }
  }

  if (!items) return <LoadingBlock />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {writable ? (
          <button className="btn-primary btn-sm" onClick={() => setEditing({ status: "PLANNED", sortOrder: 0, isPublished: true })}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New item
          </button>
        ) : null}
      </div>
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-muted">{r.category}</td>
                  <td className="px-4 py-3 text-ink">{r.title}</td>
                  <td className="px-4 py-3 text-muted">{CAPABILITY_LABELS[r.status]}</td>
                  <td className="px-4 py-3 text-muted">{r.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    {writable ? (
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          className="btn-ghost btn-sm text-danger"
                          aria-label={`Delete ${r.title}`}
                          onClick={() =>
                            confirm(async () => {
                              await adminApi.content.deleteRoadmap(r.id);
                              push({ variant: "success", title: "Item deleted" });
                              load();
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit roadmap item" : "New roadmap item"}
        footer={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" type="submit" form="roadmap-form">
              Save
            </button>
          </>
        }
      >
        {editing ? (
          <form id="roadmap-form" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            </div>
            <TextField label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={editing.status ?? "PLANNED"} onChange={(e) => setEditing({ ...editing, status: e.target.value as CapabilityStatus })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {CAPABILITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Sort order" type="number" value={String(editing.sortOrder ?? 0)} onChange={(v) => setEditing({ ...editing, sortOrder: Number(v) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isPublished ?? true} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
              Published
            </label>
          </form>
        ) : null}
      </Dialog>
      {dialog}
    </div>
  );
}

// --- Page manager ------------------------------------------------------------

interface PageRecord {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  summary?: string | null;
  body?: unknown;
}

function PageManager() {
  const { can } = useAdminAuth();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<PageRecord[] | null>(null);
  const [editing, setEditing] = useState<Partial<PageRecord> | null>(null);
  const [bodyText, setBodyText] = useState("{}");
  const writable = can("content.write");

  const load = useCallback(() => {
    adminApi.content
      .listPages()
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  function openEdit(page: Partial<PageRecord>) {
    setEditing(page);
    setBodyText(JSON.stringify(page.body ?? { sections: [] }, null, 2));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      push({ variant: "error", title: "Body must be valid JSON" });
      return;
    }
    const payload = {
      slug: editing.slug ?? "",
      title: editing.title ?? "",
      summary: editing.summary ?? null,
      body,
      status: editing.status ?? "DRAFT",
    };
    try {
      if (editing.id) await adminApi.content.updatePage(editing.id, payload);
      else await adminApi.content.createPage(payload);
      push({ variant: "success", title: "Page saved" });
      setEditing(null);
      load();
    } catch (err) {
      push({ variant: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    }
  }

  if (!items) return <LoadingBlock />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {writable ? (
          <button className="btn-primary btn-sm" onClick={() => openEdit({ status: "DRAFT" })}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New page
          </button>
        ) : null}
      </div>
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{p.slug}</td>
                  <td className="px-4 py-3 text-ink">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className={p.status === "PUBLISHED" ? "badge-implemented" : "badge-research"}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {writable ? (
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(p)} aria-label={`Edit ${p.title}`}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          className="btn-ghost btn-sm text-danger"
                          aria-label={`Delete ${p.title}`}
                          onClick={() =>
                            confirm(async () => {
                              await adminApi.content.deletePage(p.id);
                              push({ variant: "success", title: "Page deleted" });
                              load();
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit page: ${editing.slug}` : "New page"}
        size="lg"
        footer={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" type="submit" form="page-form">
              Save
            </button>
          </>
        }
      >
        {editing ? (
          <form id="page-form" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            </div>
            <Field label="Summary" value={editing.summary ?? ""} onChange={(v) => setEditing({ ...editing, summary: v })} />
            <div>
              <label className="label">Status</label>
              <select className="input" value={editing.status ?? "DRAFT"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="label">Body (JSON)</label>
              <textarea className="input font-mono text-xs" rows={9} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
              <p className="hint mt-1">
                Supported shape: {"{ \"sections\": [{ \"heading\": \"…\", \"paragraphs\": [\"…\"] }] }"}
              </p>
            </div>
          </form>
        ) : null}
      </Dialog>
      {dialog}
    </div>
  );
}

// --- Small form helpers ------------------------------------------------------

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
