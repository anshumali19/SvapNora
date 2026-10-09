import { useState } from "react";
import { StatusBadge } from "../ui/StatusBadge";
import type { CapabilityStatus } from "../../lib/status";

interface Stage {
  id: string;
  label: string;
  detail: string;
  status: CapabilityStatus;
}

const STAGES: Stage[] = [
  {
    id: "source",
    label: "Source Code",
    detail: "GlowLang source using readable keywords such as blueprint, action and show.",
    status: "IMPLEMENTED",
  },
  {
    id: "lexer",
    label: "Lexer & Parser",
    detail: "Hand-written lexer and parser producing a structured syntax tree.",
    status: "IMPLEMENTED",
  },
  {
    id: "ast",
    label: "AST",
    detail: "An abstract syntax tree that represents the program before compilation.",
    status: "IMPLEMENTED",
  },
  {
    id: "bytecode",
    label: "Bytecode / Runtime",
    detail: "Compilation to roughly 120 opcodes executed by a register-based VM with NaN-boxed values.",
    status: "IMPLEMENTED",
  },
  {
    id: "jit",
    label: "Interpreter & JIT",
    detail: "Interpretation with promotion to baseline and optimizing JIT tiers over an SSA IR.",
    status: "IN_PROGRESS",
  },
  {
    id: "native",
    label: "Native Execution",
    detail: "Machine-level execution of optimized code paths, with safe deoptimization guards.",
    status: "IN_PROGRESS",
  },
];

export function ArchitectureDiagram() {
  const [active, setActive] = useState<string>(STAGES[3]!.id);
  const current = STAGES.find((s) => s.id === active) ?? STAGES[0]!;

  return (
    <div className="panel relative overflow-hidden p-5 sm:p-8">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <div className="relative">
        <div className="flex snap-x gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-6 lg:gap-2 lg:overflow-visible">
          {STAGES.map((stage, index) => (
            <div key={stage.id} className="flex min-w-[11rem] items-center gap-2 lg:min-w-0 lg:flex-col lg:gap-3">
              <button
                type="button"
                onClick={() => setActive(stage.id)}
                aria-pressed={active === stage.id}
                className={`flex w-full flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition-all lg:items-center lg:text-center ${
                  active === stage.id
                    ? "border-accent/60 bg-accent/10"
                    : "border-line bg-surface/60 hover:border-accent/30"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-ink">{stage.label}</span>
              </button>
              {index < STAGES.length - 1 ? (
                <span
                  className="hidden text-muted/50 lg:block lg:rotate-0"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-bg-elev/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{current.label}</p>
            <StatusBadge status={current.status} />
          </div>
          <p className="mt-2 text-sm text-muted">{current.detail}</p>
          {current.status !== "IMPLEMENTED" ? (
            <p className="mt-2 text-xs text-muted/80">
              Status label indicates this component is still being developed.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
