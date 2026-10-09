import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { apiRequest } from "../lib/api";
import {
  ROADMAP,
  type CapabilityStatus,
  type RoadmapEntry,
} from "../content/glowlang";
import { CAPABILITY_LABELS } from "../lib/status";

const FILTERS: Array<{ id: "ALL" | CapabilityStatus; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "IMPLEMENTED", label: "Implemented" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "PLANNED", label: "Planned" },
  { id: "RESEARCH", label: "Research" },
];

interface ApiRoadmapItem {
  category: string;
  title: string;
  description: string;
  status: CapabilityStatus;
}

export default function Roadmap() {
  const [items, setItems] = useState<RoadmapEntry[]>(ROADMAP);
  const [filter, setFilter] = useState<"ALL" | CapabilityStatus>("ALL");
  const [source, setSource] = useState<"fallback" | "live">("fallback");

  useMeta({
    title: "Roadmap — SvapNora and GlowLang",
    description:
      "The SvapNora roadmap across the core language and runtime, JIT and optimization, AI/ML acceleration, web and database primitives, tooling, hardening and future research.",
    canonicalPath: "/roadmap",
  });

  useEffect(() => {
    let active = true;
    apiRequest<{ items: ApiRoadmapItem[] }>("/content/roadmap")
      .then((data) => {
        if (!active || !data.items?.length) return;
        setItems(
          data.items.map((i) => ({
            category: i.category,
            title: i.title,
            description: i.description,
            status: i.status,
          })),
        );
        setSource("live");
      })
      .catch(() => {
        /* keep curated fallback content */
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);
    const map = new Map<string, RoadmapEntry[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [items, filter]);

  const counts = useMemo(() => {
    const c: Record<CapabilityStatus, number> = {
      IMPLEMENTED: 0,
      IN_PROGRESS: 0,
      PLANNED: 0,
      RESEARCH: 0,
    };
    for (const i of items) c[i.status]++;
    return c;
  }, [items]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-3">Roadmap</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              What we are building, and <span className="text-gradient">what comes next</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              Status labels distinguish completed work from ongoing, planned and exploratory
              efforts. No deadlines are published unless explicitly approved.
            </p>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2">
            {(Object.keys(counts) as CapabilityStatus[]).map((s) => (
              <span key={s} className="badge border-line bg-surface/70 text-muted">
                {CAPABILITY_LABELS[s]}: <strong className="text-ink">{counts[s]}</strong>
              </span>
            ))}
            <span className="badge border-line bg-surface/70 text-muted">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              {source === "live" ? "Live content" : "Curated snapshot"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter roadmap by status">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  filter === f.id
                    ? "border-accent/60 bg-accent/10 text-ink"
                    : "border-line bg-surface/60 text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <div className="space-y-10">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted">No roadmap entries match this filter.</p>
          ) : (
            grouped.map(([category, entries], gi) => (
              <Reveal key={category} delay={gi * 0.03}>
                <div>
                  <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
                    <span className="h-px w-6 bg-accent" aria-hidden />
                    {category}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {entries.map((item) => (
                      <div key={item.title} className="card-hover p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-sm text-muted">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))
          )}
        </div>
      </Section>

      <section className="container-x section-y">
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">See the architecture behind the plan</h2>
            <p className="max-w-xl text-muted">
              Understand how the language, runtime and tooling fit together.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/technology" className="btn-primary">
                Explore the technology
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/glowlang" className="btn-secondary">
                About GlowLang
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
