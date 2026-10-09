import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Gauge, GitBranch, MemoryStick } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ArchitectureDiagram } from "../components/public/ArchitectureDiagram";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ARCHITECTURE_LAYERS, FEATURE_GROUPS } from "../content/glowlang";

const PRINCIPLES = [
  {
    icon: Gauge,
    title: "Performance-oriented runtime",
    text: "A register-based VM and tiered JIT are designed to keep execution efficient without giving up readability.",
  },
  {
    icon: MemoryStick,
    title: "Explicit memory strategy",
    text: "NaN-boxed values, a generational collector and arena allocation are core to the value model.",
  },
  {
    icon: ShieldCheck,
    title: "Honest status reporting",
    text: "Every capability is labelled implemented, in progress, planned or exploratory.",
  },
  {
    icon: GitBranch,
    title: "Built from zero",
    text: "Lexer, parser, compiler, VM and tooling are authored from scratch rather than assembled from existing engines.",
  },
];

export default function Technology() {
  useMeta({
    title: "Technology & architecture — SvapNora",
    description:
      "How GlowLang is engineered: a from-scratch language frontend, register-based VM, generational memory management, tiered JIT, AI/ML acceleration and native web/database primitives.",
    canonicalPath: "/technology",
  });

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-3">Technology</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              How GlowLang is <span className="text-gradient">engineered</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              GlowLang is a complete system: a hand-written language frontend, a register-based
              virtual machine, a memory model, an in-progress tiered JIT, AI/ML primitives and
              built-in web and database capabilities.
            </p>
          </Reveal>
        </div>
      </section>

      <Section eyebrow="Pipeline" title="The execution path">
        <Reveal>
          <ArchitectureDiagram />
        </Reveal>
      </Section>

      <Section eyebrow="Principles" title="Design principles">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="card-hover h-full p-5">
                <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                  <p.icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Layers" title="Architecture at a glance">
        <div className="space-y-4">
          {ARCHITECTURE_LAYERS.map((layer, i) => (
            <Reveal key={layer.id} delay={i * 0.03}>
              <div className="card p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Layer {i + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{layer.name}</h3>
                  </div>
                  <div>
                    <p className="text-sm text-muted">{layer.purpose}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {layer.components.map((c) => (
                        <span key={c} className="badge border-line bg-surface-2 text-ink">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted">{layer.notes}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Capability matrix"
        title="Implementation status"
        subtitle="Only capabilities confirmed by the project are marked implemented. Everything else carries an explicit status."
      >
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Capability</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_GROUPS.flatMap((g) =>
                  g.items.map((item) => (
                    <tr key={`${g.category}-${item.title}`} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 text-muted">{item.category}</td>
                      <td className="px-4 py-3 font-medium text-ink">{item.title}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Memory & values"
        title="A runtime built for control"
        subtitle="How values and memory are represented matters as much as the syntax at the surface."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CodeBlock
            showLineNumbers
            filename="runtime.glow"
            code={`# Tensors are ordinary values in the runtime
let weights = tensor.zeros(256)

# Scoped values are reclaimed by the generational collector
action step(x):
    let y = tensor.mul(x, 2.0)
    return y
end`}
          />
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">NaN-boxed values</h3>
                <StatusBadge status="IMPLEMENTED" />
              </div>
              <p className="mt-2 text-sm text-muted">
                Several runtime types are packed into a single 64-bit word, keeping the value
                representation compact.
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generational GC & arenas</h3>
                <StatusBadge status="IMPLEMENTED" />
              </div>
              <p className="mt-2 text-sm text-muted">
                Short-lived objects are handled with bump-pointer arena allocation, complemented by a
                generational collector.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <section className="container-x section-y">
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Track the engineering progress</h2>
            <p className="max-w-xl text-muted">
              The roadmap records what is implemented, in progress, planned and exploratory.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/roadmap" className="btn-primary">
                View the roadmap
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/about" className="btn-secondary">
                Read our story
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
