import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Braces, Cpu, Database, Network, Wrench, Bot } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { CodeBlock } from "../components/ui/CodeBlock";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ArchitectureDiagram } from "../components/public/ArchitectureDiagram";
import {
  ARCHITECTURE_LAYERS,
  FEATURE_GROUPS,
  SYNTAX_CODE,
  TENSOR_CODE,
  WEB_CODE,
} from "../content/glowlang";

const REPO_URL = import.meta.env.VITE_REPO_URL as string | undefined;

const DOCS = [
  {
    id: "getting-started",
    title: "Getting started",
    paragraphs: [
      "GlowLang programs are organised into blueprints (structures) with actions (behaviour). Output is produced with show.",
      "This section is introductory documentation drawn from the supplied project specifications. API behaviour is only described where it has been verified.",
    ],
    code: `blueprint Hello:
    action init(name):
        self.name = name
    end

    action greet():
        show "Hello, " + self.name
    end
end

let h = Hello("world")
h.greet()`,
  },
  {
    id: "syntax",
    title: "Natural syntax",
    paragraphs: [
      "The language favours keywords that read close to intent: every and whenever express repeating and reactive behaviour, and when introduces a conditional.",
    ],
    code: SYNTAX_CODE,
  },
  {
    id: "runtime",
    title: "Runtime & memory",
    paragraphs: [
      "Execution runs on a register-based VM with roughly 120 opcodes. Values use NaN boxing, and memory is managed by a generational collector with bump-pointer arena allocation.",
    ],
    code: `# Runtime value representation is managed for you
let values = []
every 1 second:
    values.push(tensor.zeros(16))
end`,
  },
  {
    id: "jit",
    title: "JIT & optimization",
    paragraphs: [
      "Programs begin in the interpreter and can be promoted to a baseline JIT and then an optimizing JIT that operates on an SSA intermediate representation.",
      "Optimizations include loop optimizations and polymorphic inline caching, guarded by speculative optimization and safe deoptimization. Promotion thresholds and gains depend on the implementation and workload.",
    ],
    code: `action sum(n):
    let total = 0
    for i in range(n):
        total = total + i
    end
    return total
end`,
  },
  {
    id: "tensors",
    title: "AI/ML & tensors",
    paragraphs: [
      "Tensor operations expose vectorized CPU paths oriented toward AVX2 and SSE4.2 where the hardware and build support them. CUDA integration is optional and requires compatible hardware.",
    ],
    code: TENSOR_CODE,
  },
  {
    id: "web",
    title: "Web & databases",
    paragraphs: [
      "GlowLang ships HTTP primitives, SQLite bindings, a Redis client and a lightweight web framework, along with thread spawning and reactive whenever behaviour.",
    ],
    code: WEB_CODE,
  },
];

const LAYER_ICONS: Record<string, typeof Braces> = {
  frontend: Braces,
  pipeline: Cpu,
  runtime: Cpu,
  jit: Cpu,
  ai: Bot,
  network: Network,
  tools: Wrench,
};

export default function GlowLang() {
  const [layer, setLayer] = useState(ARCHITECTURE_LAYERS[0]!.id);
  const [doc, setDoc] = useState(DOCS[0]!.id);
  const activeLayer = ARCHITECTURE_LAYERS.find((l) => l.id === layer)!;
  const activeDoc = DOCS.find((d) => d.id === doc)!;

  useMeta({
    title: "GlowLang — Expressive by design. Engineered from the ground up.",
    description:
      "GlowLang combines natural, human-readable syntax with a runtime and tooling ecosystem implemented in C, including a register-based VM, tiered JIT, tensor operations and native web/database primitives.",
    canonicalPath: "/glowlang",
  });

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow mb-3">GlowLang</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Expressive by design. <span className="text-gradient">Engineered from the ground up.</span>
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              GlowLang pairs natural, human-readable syntax with a runtime and tooling ecosystem
              implemented in C — from the lexer and register-based VM to JIT compilation, tensor
              operations and native web primitives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#docs" className="btn-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
                Read documentation
              </a>
              <a href="#architecture" className="btn-secondary">
                Explore the architecture
              </a>
              {REPO_URL ? (
                <a href={REPO_URL} className="btn-ghost" target="_blank" rel="noreferrer noopener">
                  View the source code
                </a>
              ) : null}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="min-w-0">
            <CodeBlock code={SYNTAX_CODE} filename="counter.glow" showLineNumbers />
          </Reveal>
        </div>
      </section>

      {/* Natural syntax showcase */}
      <Section
        eyebrow="Product demonstration"
        title="Natural syntax showcase"
        subtitle="A short program that combines a blueprint, an action, a scheduled every block and a guarded when."
        actions={<span className="hint">Copy the sample to try the syntax for yourself.</span>}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <CodeBlock code={`blueprint ServerNode:
    action init(port):
        self.port = port
    end

    action start():
        let server = http.listen(self.port)
        show "GlowLang Server running on port " + self.port
    end
end

let node = ServerNode(8080)
node.start()`} filename="server_node.glow" showLineNumbers />
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold">What this illustrates</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><code className="text-accent">blueprint</code> groups related state and behaviour.</li>
                <li><code className="text-accent">action</code> declares a method on the structure.</li>
                <li><code className="text-accent">show</code> writes a value to standard output.</li>
              </ul>
            </div>
            <p className="text-xs text-muted">
              This sample is presented as a product demonstration. It is not executed by the
              website itself.
            </p>
          </div>
        </div>
      </Section>

      {/* Core capabilities */}
      <Section
        eyebrow="Capabilities"
        title="Core capabilities"
        subtitle="Every capability carries an explicit status label so the current state of development is clear."
      >
        <div className="space-y-8">
          {FEATURE_GROUPS.map((group, gi) => (
            <Reveal key={group.category} delay={gi * 0.03}>
              <div>
                <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold">
                  <span className="h-px w-6 bg-accent" aria-hidden />
                  {group.category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <div key={item.title} className="card-hover p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-2 text-sm text-muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Architecture explorer */}
      <Section
        id="architecture"
        eyebrow="Architecture"
        title="Technical architecture explorer"
        subtitle="Select a layer to see its purpose, the components involved and implementation notes."
      >
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {ARCHITECTURE_LAYERS.map((l) => {
              const Icon = LAYER_ICONS[l.id] ?? Cpu;
              const isActive = l.id === layer;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayer(l.id)}
                  aria-pressed={isActive}
                  className={`flex min-w-[14rem] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition lg:min-w-0 ${
                    isActive
                      ? "border-accent/60 bg-accent/10 text-ink"
                      : "border-line bg-surface/60 text-muted hover:border-accent/30 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {l.name}
                </button>
              );
            })}
          </div>
          <div className="panel p-6">
            <h3 className="text-lg font-semibold">{activeLayer.name}</h3>
            <p className="mt-2 text-sm text-muted">{activeLayer.purpose}</p>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Components</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeLayer.components.map((c) => (
                  <span key={c} className="badge border-line bg-surface-2 text-ink">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4 text-sm text-muted">
              {activeLayer.notes}
            </p>
          </div>
        </div>
        <div className="mt-8">
          <ArchitectureDiagram />
        </div>
      </Section>

      {/* Tensor example */}
      <Section
        eyebrow="AI/ML"
        title="Tensor operations"
        subtitle="Tensor primitives form the basis of GlowLang's AI/ML story."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CodeBlock code={TENSOR_CODE} filename="tensors.glow" />
          <div className="space-y-4">
            <p className="text-sm text-muted">
              CPU vectorization depends on supported hardware, build configuration and the
              implementation path used. CUDA requires compatible hardware and a correctly configured
              build.
            </p>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Acceleration paths</h3>
                <StatusBadge status="IN_PROGRESS" />
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>AVX2 / SSE4.2-oriented CPU tensor operations.</li>
                <li>Optional CUDA integration (requires compatible hardware).</li>
                <li>Autograd and neural network modules via glowtorch and ai.glow.</li>
              </ul>
            </div>
            <p className="text-xs text-muted">
              No benchmark figures are published here, as verified measurements are not yet available.
            </p>
          </div>
        </div>
      </Section>

      {/* Documentation experience */}
      <Section
        id="docs"
        eyebrow="Documentation"
        title="Introductory documentation"
        subtitle="A starting point drawn from the project specifications. This is clearly identified as introductory material."
      >
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Documentation topics" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {DOCS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDoc(d.id)}
                aria-current={d.id === doc ? "true" : undefined}
                className={`min-w-[11rem] rounded-lg px-3.5 py-2 text-left text-sm transition lg:min-w-0 ${
                  d.id === doc ? "bg-surface-2 font-semibold text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {d.title}
              </button>
            ))}
          </nav>
          <div className="panel min-w-0 p-6">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Database className="h-3.5 w-3.5" aria-hidden />
              Introductory documentation
            </div>
            <h3 className="mt-3 text-xl font-semibold">{activeDoc.title}</h3>
            {activeDoc.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted">
                {p}
              </p>
            ))}
            <div className="mt-5">
              <CodeBlock code={activeDoc.code} filename={`${activeDoc.id}.glow`} />
            </div>
          </div>
        </div>
      </Section>

      <section className="container-x section-y">
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Want to go deeper?</h2>
            <p className="max-w-xl text-muted">
              Explore how the pieces fit together, track what is being built, or reach out to
              discuss the project.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/technology" className="btn-primary">
                Explore the technology
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/roadmap" className="btn-secondary">
                View the roadmap
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
