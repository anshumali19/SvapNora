import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Boxes, Sparkles, Layers, Zap, Wrench } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { CodeBlock } from "../components/ui/CodeBlock";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ArchitectureDiagram } from "../components/public/ArchitectureDiagram";
import { HERO_CODE, HIGHLIGHTS, MILESTONES } from "../content/glowlang";

const ICONS = [Cpu, Zap, Boxes, Sparkles, Layers, Wrench];

export default function Home() {
  useMeta({
    title: "SvapNora — A new language for the way we think about code",
    description:
      "GlowLang is a programming language built from the ground up in C, combining readable, expressive syntax with a performance-oriented runtime and an expanding developer ecosystem.",
    canonicalPath: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "GlowLang",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      creator: { "@type": "Organization", name: "SvapNora" },
      description:
        "GlowLang combines readable, expressive syntax with a performance-oriented runtime implemented in C.",
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="glow-orb -top-24 left-1/3 h-72 w-72 bg-accent/25"
          aria-hidden
        />
        <div className="container-x relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <Reveal>
              <span className="badge border-accent/40 bg-accent/10 text-accent">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Building GlowLang from the ground up
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
                A new language for the way we <span className="text-gradient">think about code</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
                Meet GlowLang — a programming language built from the ground up in C, combining
                readable, expressive syntax with a performance-oriented runtime and an expanding
                developer ecosystem.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/glowlang" className="btn-primary">
                  Explore GlowLang
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link to="/technology" className="btn-secondary">
                  Discover the architecture
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted">
                Status labels throughout this site distinguish implemented features from planned work.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="min-w-0">
            <div className="relative min-w-0">
              <CodeBlock code={HERO_CODE} filename="server.glow" showLineNumbers />
              <div className="pointer-events-none absolute -inset-x-6 -bottom-8 h-24 bg-gradient-to-t from-bg to-transparent" aria-hidden />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Engineering highlights */}
      <Section
        id="highlights"
        eyebrow="Engineering"
        title="Technical capabilities"
        subtitle="A system that spans language design, runtime engineering and developer tooling."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]!;
            return (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="card-hover h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl border border-line bg-surface-2 p-2 text-accent">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-muted">
          These are technical descriptions of the project, not comparative performance claims.
        </p>
      </Section>

      {/* GlowLang intro */}
      <Section
        eyebrow="The idea"
        title="Readable code without abandoning systems engineering"
        subtitle="GlowLang aims to make programs easier to read and reason about, while keeping tight control of the runtime that executes them."
        actions={
          <Link to="/glowlang" className="btn-secondary">
            Explore GlowLang in depth
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Intent as syntax</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["blueprint", "describes a structure"],
                ["action", "describes behaviour"],
                ["show", "produces output"],
                ["every", "schedules repetition"],
                ["when", "guards a condition"],
                ["whenever", "reacts to an event"],
              ].map(([kw, desc]) => (
                <li key={kw} className="flex items-baseline gap-3">
                  <code className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs text-accent">
                    {kw}
                  </code>
                  <span className="text-muted">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Under the hood</h3>
            <p className="mt-4 text-sm text-muted">
              The same readable surface maps onto a serious execution engine: a register-based VM,
              NaN-boxed values, generational garbage collection and a tiered JIT under active
              development. The goal is clarity at the surface and control beneath it.
            </p>
            <p className="mt-4 text-sm text-muted">
              JIT promotion thresholds and optimization behaviour are still being developed and will
              depend on the implementation and workload.
            </p>
          </div>
        </div>
      </Section>

      {/* Architecture preview */}
      <Section
        id="architecture"
        eyebrow="Execution pipeline"
        title="From source to native execution"
        subtitle="Select a stage to see what it does. Components still under development are labelled as such."
      >
        <Reveal>
          <ArchitectureDiagram />
        </Reveal>
      </Section>

      {/* Journey preview */}
      <Section
        id="journey"
        eyebrow="Our journey"
        title="From an idea to an ecosystem"
        subtitle="An engineering journey that began with a question about how code could read more naturally."
        actions={
          <>
            <Link to="/about" className="btn-secondary">
              Read our story
            </Link>
            <Link to="/roadmap" className="btn-ghost">
              View the roadmap
            </Link>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {MILESTONES.slice(0, 3).map((m, i) => (
            <Reveal key={m.title} delay={i * 0.05}>
              <div className="card-hover h-full p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">{m.phase}</p>
                <h3 className="mt-2 text-base font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-muted">{m.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Future vision */}
      <Section
        eyebrow="Looking ahead"
        title="Where GlowLang is heading"
        subtitle="Directions under exploration or development. These are goals, not completed products."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["More complete AI/ML tooling", "Deeper tensor, autograd and neural network support.", "PLANNED"],
            ["Better GPU and accelerator support", "Broader, well-tested acceleration paths.", "RESEARCH"],
            ["Expanded editor integrations", "Wider LSP and editor coverage.", "IN_PROGRESS"],
            ["A stronger package ecosystem", "More packages and smoother dependency workflows.", "PLANNED"],
            ["Cross-platform developer experience", "Consistent builds and tooling across platforms.", "IN_PROGRESS"],
            ["More documentation and community", "Guides, references and community resources.", "PLANNED"],
          ] as const).map(([title, desc, status], i) => (
            <Reveal key={title} delay={i * 0.04}>
              <div className="card-hover h-full p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-2 text-sm text-muted">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <section className="container-x section-y">
        <Reveal>
          <div className="panel relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="glow-orb -top-16 left-1/2 h-56 w-56 -translate-x-1/2 bg-accent/25" aria-hidden />
            <div className="relative">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Follow the build, explore the language, or get in touch.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted">
                GlowLang is under active development. Reach out for technical discussions,
                collaboration or general questions.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/glowlang" className="btn-primary">
                  Explore GlowLang
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Contact SvapNora
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
