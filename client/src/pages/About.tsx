import { Link } from "react-router-dom";
import { ArrowRight, Flag, Rocket, Search } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CodeBlock } from "../components/ui/CodeBlock";
import { MILESTONES } from "../content/glowlang";

export default function About() {
  useMeta({
    title: "Our Story — From zero to SvapNora",
    description:
      "The engineering journey behind GlowLang: starting from an idea, building the language and runtime from scratch, adding JIT compilation and AI/ML features, and expanding the ecosystem.",
    canonicalPath: "/about",
  });

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-3">Our story</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              From an idea to <span className="text-gradient">an ecosystem</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              SvapNora exists to build developer technology from first principles. GlowLang is the
              clearest expression of that philosophy — a language and runtime built from zero, in C.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Narrative */}
      <Section eyebrow="The beginning" title="An idea about how code should read">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="prose-glow text-base">
            <p>
              We started with a simple observation: programming syntax often forces a choice between
              being readable to humans and being explicit for machines. We wanted to challenge that
              trade-off — to build a language whose surface reads close to intention while retaining
              full control over the runtime beneath it.
            </p>
            <p>
              That idea became GlowLang: structures described with <code className="text-accent">blueprint</code>,
              behaviour with <code className="text-accent">action</code>, and events with{" "}
              <code className="text-accent">every</code>, <code className="text-accent">when</code> and{" "}
              <code className="text-accent">whenever</code>.
            </p>
          </div>
          <CodeBlock
            filename="the_idea.glow"
            code={`blueprint Idea:
    action init(question):
        self.question = question
    end
end

let glow = Idea("can code read the way we think?")
show glow.question`}
          />
        </div>
      </Section>

      <Section eyebrow="Building the foundation" title="Lexer, parser, VM and memory">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <CodeBlock
            filename="foundation.glow"
            code={`# Values are NaN-boxed; memory is generational
let arena = alloc.arena(4096)

blueprint Node:
    action init(value):
        self.value = value
    end
end`}
          />
          <div className="prose-glow text-base">
            <p>
              We wrote the lexer, parser and AST by hand, then a register-based virtual machine with
              a compact instruction set of roughly 120 bytecode opcodes. We designed a value
              representation using NaN boxing and a memory system combining a generational garbage
              collector with bump-pointer arena allocation.
            </p>
            <p>
              These choices prioritise predictable performance and a small, understandable core over
              shortcuts.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Making execution smarter" title="Toward tiered compilation">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="prose-glow text-base">
            <p>
              With the interpreter working, we turned to execution speed. GlowLang is moving toward a
              tiered model: interpretation that promotes hot code to a baseline JIT and then to an
              optimizing JIT operating on an SSA-based intermediate representation.
            </p>
            <p>
              Optimizations include loop optimizations and polymorphic inline caching, guarded by
              speculative optimization and safe deoptimization. This work is in progress, and
              promotion thresholds and gains depend on the implementation and workload.
            </p>
            <div className="not-prose mt-4">
              <StatusBadge status="IN_PROGRESS" />
            </div>
          </div>
          <CodeBlock
            filename="hot_loop.glow"
            code={`action sum_to(n):
    let total = 0
    for i in range(n):
        total = total + i
    end
    return total
end`}
          />
        </div>
      </Section>

      <Section eyebrow="Expanding into AI/ML" title="Tensors, autograd and acceleration">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <CodeBlock
            filename="ai.glow"
            code={`let w = tensor.randn(256, 256)
let x = tensor.zeros(256)
let y = tensor.matmul(w, x)`}
          />
          <div className="prose-glow text-base">
            <p>
              We added tensor operations with vectorized CPU paths oriented toward AVX2 and SSE4.2
              where supported, alongside autograd and neural network building blocks exposed through
              glowtorch and ai.glow.
            </p>
            <p>
              Optional CUDA integration is planned for systems with compatible hardware and a
              correctly configured build. CPU vectorization depends on the hardware and build
              configuration in use.
            </p>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section
        eyebrow="Timeline"
        title="The journey so far"
        subtitle="A progression from first principles to a growing ecosystem. Status labels reflect the current state."
      >
        <ol className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-2rem)] before:w-px before:bg-line md:before:left-1/2">
          {MILESTONES.map((m, i) => (
            <li key={m.title} className="relative">
              <Reveal delay={i * 0.03}>
                <div
                  className={`ml-10 md:ml-0 md:grid md:grid-cols-2 md:gap-8 ${
                    i % 2 === 1 ? "md:[&>*:first-child]:col-start-2" : ""
                  }`}
                >
                  <div className={`card p-5 ${i % 2 === 1 ? "md:text-left" : "md:text-right"}`}>
                    <div className={`flex items-center gap-2 ${i % 2 === 1 ? "" : "md:justify-end"}`}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {m.phase}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm text-muted">{m.description}</p>
                    <div className={`mt-3 flex ${i % 2 === 1 ? "" : "md:justify-end"}`}>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                </div>
                <span
                  className="absolute left-[8px] top-6 h-4 w-4 rounded-full border-2 border-bg bg-accent md:left-1/2 md:-translate-x-1/2"
                  aria-hidden
                />
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* Then -> Now -> Next */}
      <Section eyebrow="Perspective" title="Then → now → next">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Flag,
              label: "Then",
              title: "A question",
              text: "Could code read the way we think, without sacrificing control?",
              status: "IMPLEMENTED" as const,
            },
            {
              icon: Search,
              label: "Now",
              title: "A working system",
              text: "A language, VM, memory model and growing tooling, with JIT and AI/ML work in progress.",
              status: "IN_PROGRESS" as const,
            },
            {
              icon: Rocket,
              label: "Next",
              title: "A stronger ecosystem",
              text: "More complete AI/ML tooling, broader accelerator support and richer editor and package ecosystems.",
              status: "PLANNED" as const,
            },
          ].map((col, i) => (
            <Reveal key={col.label} delay={i * 0.06}>
              <div className="card-hover h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                    <col.icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <StatusBadge status={col.status} />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{col.label}</p>
                <h3 className="mt-1 text-lg font-semibold">{col.title}</h3>
                <p className="mt-2 text-sm text-muted">{col.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="container-x section-y">
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Be part of the build</h2>
            <p className="max-w-xl text-muted">
              We welcome technical discussions, collaboration and questions from developers,
              researchers and students.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="btn-primary">
                Get in touch
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/glowlang" className="btn-secondary">
                Explore GlowLang
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
