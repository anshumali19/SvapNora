import { PrismaClient } from "@prisma/client";
import { env } from "../src/env";

const prisma = new PrismaClient();

type Seed<T> = T & { id: string };

const features: Seed<{
  category: string;
  title: string;
  description: string;
  status: "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";
  sortOrder: number;
}>[] = [
  {
    id: "feat-syntax-natural",
    category: "Natural syntax",
    title: "Readable, intention-revealing keywords",
    description:
      "GlowLang uses blueprint, action, show, every, when and whenever to express structure, behaviour and events in plain, human-friendly language.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "feat-runtime-register-vm",
    category: "Runtime and memory",
    title: "Register-based virtual machine",
    description:
      "A register-based VM designed around a compact instruction set of roughly 120 bytecode opcodes.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "feat-runtime-nanbox",
    category: "Runtime and memory",
    title: "NaN-boxed values",
    description:
      "Value representation that packs multiple runtime types into a single 64-bit word to reduce overhead.",
    status: "IMPLEMENTED",
    sortOrder: 2,
  },
  {
    id: "feat-runtime-gc",
    category: "Runtime and memory",
    title: "Generational garbage collection",
    description:
      "A generational collector complemented by bump-pointer arena allocation for short-lived objects.",
    status: "IMPLEMENTED",
    sortOrder: 3,
  },
  {
    id: "feat-jit-tiered",
    category: "JIT compilation",
    title: "Multi-tiered JIT",
    description:
      "Execution begins in the interpreter and can be promoted to a baseline JIT and then an optimizing JIT.",
    status: "IN_PROGRESS",
    sortOrder: 1,
  },
  {
    id: "feat-jit-ssa",
    category: "JIT compilation",
    title: "SSA-based intermediate representation",
    description:
      "Optimizations operate on an SSA IR with loop optimizations and polymorphic inline caching, guarded by speculative optimization and safe deoptimization.",
    status: "IN_PROGRESS",
    sortOrder: 2,
  },
  {
    id: "feat-ai-tensors",
    category: "AI/ML and tensors",
    title: "CPU tensor operations",
    description:
      "Tensor primitives with AVX2/SSE4.2-oriented vectorized paths where the hardware and build support them.",
    status: "IN_PROGRESS",
    sortOrder: 1,
  },
  {
    id: "feat-ai-cuda",
    category: "AI/ML and tensors",
    title: "Optional CUDA integration",
    description:
      "Optional GPU acceleration path requiring compatible hardware and a correctly configured build.",
    status: "PLANNED",
    sortOrder: 2,
  },
  {
    id: "feat-ai-autograd",
    category: "AI/ML and tensors",
    title: "Autograd and neural network modules",
    description:
      "Building blocks for automatic differentiation and neural network layers, exposed through glowtorch and ai.glow where implemented.",
    status: "IN_PROGRESS",
    sortOrder: 3,
  },
  {
    id: "feat-web-http",
    category: "Web and databases",
    title: "Native HTTP and SQLite primitives",
    description:
      "Built-in HTTP server primitives and SQLite bindings, with a Redis client and a lightweight web framework.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "feat-web-concurrency",
    category: "Web and databases",
    title: "Threads and reactive whenever",
    description:
      "Thread spawning combined with reactive whenever behaviour for event-driven programs.",
    status: "IMPLEMENTED",
    sortOrder: 2,
  },
  {
    id: "feat-tools-gdu",
    category: "Developer ecosystem",
    title: "Glow Dependency Utility (gdu)",
    description:
      "Package management with semantic versioning, dependency resolution and SHA-256 integrity verification.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "feat-tools-lsp",
    category: "Developer ecosystem",
    title: "Language Server Protocol and editor support",
    description:
      "LSP support with editor integrations, a debugger, profiler, heap and bytecode inspection and a WebAssembly playground.",
    status: "IN_PROGRESS",
    sortOrder: 2,
  },
];

const milestones: Seed<{
  phase: string;
  title: string;
  description: string;
  status: "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";
  sortOrder: number;
}>[] = [
  {
    id: "ms-idea",
    phase: "The beginning",
    title: "An idea",
    description:
      "The vision of making programming syntax more natural and approachable while keeping full control over runtime design and systems-level execution.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "ms-foundation",
    phase: "Building the foundation",
    title: "Lexer, parser and VM",
    description:
      "Constructing the lexer, parser, AST, register-based VM, value representation, garbage collector and allocator.",
    status: "IMPLEMENTED",
    sortOrder: 2,
  },
  {
    id: "ms-jit",
    phase: "Making execution smarter",
    title: "Tiered JIT and optimization",
    description:
      "Moving from interpretation toward tiered JIT compilation, an SSA intermediate representation, optimization and speculative deoptimization.",
    status: "IN_PROGRESS",
    sortOrder: 3,
  },
  {
    id: "ms-ai",
    phase: "Expanding into AI/ML",
    title: "Tensors and acceleration",
    description:
      "Adding tensor operations, CPU vectorization, optional CUDA integration and neural network capabilities.",
    status: "IN_PROGRESS",
    sortOrder: 4,
  },
  {
    id: "ms-ecosystem",
    phase: "Building beyond the language",
    title: "Web, databases and tooling",
    description:
      "Networking and database primitives, concurrency features, package management, LSP, debugging and editor support.",
    status: "IN_PROGRESS",
    sortOrder: 5,
  },
  {
    id: "ms-hardening",
    phase: "Hardening the ecosystem",
    title: "Cross-platform validation",
    description:
      "Cross-platform build work, testing, sanitizers, fuzzing, validation libraries and WebAssembly-related efforts.",
    status: "IN_PROGRESS",
    sortOrder: 6,
  },
  {
    id: "ms-next",
    phase: "What comes next",
    title: "Future directions",
    description:
      "More complete AI/ML tooling, broader accelerator support, expanded editor integrations and a stronger package ecosystem.",
    status: "PLANNED",
    sortOrder: 7,
  },
];

const roadmap: Seed<{
  category: string;
  title: string;
  description: string;
  status: "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";
  sortOrder: number;
}>[] = [
  {
    id: "rm-core",
    category: "Core language and runtime",
    title: "Grammar, VM and memory management",
    description:
      "Continued refinement of the lexer, parser, AST, register-based VM, NaN-boxed values and the generational collector with arena allocation.",
    status: "IMPLEMENTED",
    sortOrder: 1,
  },
  {
    id: "rm-jit",
    category: "JIT and optimization",
    title: "Tiered JIT and SSA optimization",
    description:
      "Baseline and optimizing JIT tiers, SSA IR, loop optimizations, polymorphic inline caching and safe deoptimization guards.",
    status: "IN_PROGRESS",
    sortOrder: 2,
  },
  {
    id: "rm-ai",
    category: "AI/ML and accelerator support",
    title: "Tensors, autograd and GPU paths",
    description:
      "CPU vectorized tensor operations, autograd, neural network modules and optional CUDA integration where hardware and builds allow.",
    status: "IN_PROGRESS",
    sortOrder: 3,
  },
  {
    id: "rm-web",
    category: "Web, database and concurrency primitives",
    title: "HTTP, SQLite, Redis and threads",
    description:
      "Native HTTP primitives, SQLite bindings, a Redis client, a lightweight web framework and reactive whenever behaviour.",
    status: "IMPLEMENTED",
    sortOrder: 4,
  },
  {
    id: "rm-tools",
    category: "Developer tooling and editor integrations",
    title: "gdu, LSP and inspection tools",
    description:
      "Package management with integrity verification, LSP support, editor integrations, debugger, profiler and heap/bytecode inspection.",
    status: "IN_PROGRESS",
    sortOrder: 5,
  },
  {
    id: "rm-hardening",
    category: "Production hardening and ecosystem",
    title: "Cross-platform builds and validation",
    description:
      "Cross-platform build matrix, testing, sanitizers, fuzzing, validation libraries and WebAssembly-related efforts.",
    status: "IN_PROGRESS",
    sortOrder: 6,
  },
  {
    id: "rm-research",
    category: "Future research and innovations",
    title: "Exploratory directions",
    description:
      "Research into broader accelerator support, advanced optimizations and new developer experiences. These are exploratory and not committed deliverables.",
    status: "RESEARCH",
    sortOrder: 7,
  },
];

const pages: Seed<{
  slug: string;
  title: string;
  summary: string;
  body: unknown;
  status: "DRAFT" | "PUBLISHED";
}>[] = [
  {
    id: "page-announcement",
    slug: "announcement",
    title: "GlowLang development is ongoing",
    summary:
      "SvapNora is actively building GlowLang from the ground up in C. Status labels throughout this site distinguish implemented features from planned work.",
    body: {
      paragraphs: [
        "GlowLang blends readable, human-friendly syntax with a runtime and tooling ecosystem implemented in C.",
        "This site is the official home of the project. Feature and roadmap entries carry explicit status labels and are updated as development progresses.",
      ],
    },
    status: "PUBLISHED",
  },
  {
    id: "page-privacy",
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "How SvapNora handles the limited information submitted through this website.",
    body: {
      sections: [
        {
          heading: "Information we collect",
          paragraphs: [
            "When you submit the contact form we store the name, email address, subject, category and message you provide, together with basic request metadata used for abuse prevention.",
            "We do not use advertising trackers on this website.",
          ],
        },
        {
          heading: "How we use information",
          paragraphs: [
            "Contact submissions are used solely to respond to your enquiry. Payment records, where present, are maintained for accounting and reconciliation purposes.",
          ],
        },
        {
          heading: "Retention and rights",
          paragraphs: [
            "Submissions are retained only as long as necessary to handle your enquiry. You may request access to, or deletion of, the information associated with your submission.",
          ],
        },
      ],
    },
    status: "PUBLISHED",
  },
  {
    id: "page-terms",
    slug: "terms",
    title: "Terms of Service",
    summary: "The terms that govern use of the SvapNora website.",
    body: {
      sections: [
        {
          heading: "Use of this website",
          paragraphs: [
            "This website is provided for information about SvapNora and the GlowLang project. Descriptions of features and roadmap items are indicative and may change as development progresses.",
          ],
        },
        {
          heading: "No warranty",
          paragraphs: [
            "Content is provided on an as-is basis. Status labels indicate development progress and are not contractual commitments or performance guarantees.",
          ],
        },
        {
          heading: "Third-party services",
          paragraphs: [
            "Where third-party services such as payment or email providers are used, their own terms apply to those interactions.",
          ],
        },
      ],
    },
    status: "PUBLISHED",
  },
];

async function main() {
  for (const f of features) {
    await prisma.glowLangFeature.upsert({
      where: { id: f.id },
      update: { ...f },
      create: { ...f, isPublished: true },
    });
  }
  for (const m of milestones) {
    await prisma.companyMilestone.upsert({
      where: { id: m.id },
      update: { ...m },
      create: { ...m, isPublished: true },
    });
  }
  for (const r of roadmap) {
    await prisma.roadmapItem.upsert({
      where: { id: r.id },
      update: { ...r },
      create: { ...r, isPublished: true },
    });
  }
  for (const p of pages) {
    await prisma.companyPage.upsert({
      where: { id: p.id },
      update: { ...p, body: p.body as never },
      create: { ...p, body: p.body as never },
    });
  }

  // Demo payment records are only created in demo mode and are clearly
  // labelled as provider "demo". They are never presented as real revenue.
  if (env.PAYMENTS_DEMO_MODE && env.PAYMENT_PROVIDER === "none") {
    const demoPayments = [
      {
        id: "demo-pay-1",
        providerTxnId: "demo_seed_0001",
        customerName: "Demo Customer",
        customerEmail: "demo@example.com",
        orderRef: "DEMO-1001",
        amountMinor: 4900n,
        currency: env.PAYMENTS_CURRENCY,
        method: "demo-card",
        status: "SUCCESSFUL" as const,
      },
      {
        id: "demo-pay-2",
        providerTxnId: "demo_seed_0002",
        customerName: "Demo Customer",
        customerEmail: "demo@example.com",
        orderRef: "DEMO-1002",
        amountMinor: 12900n,
        currency: env.PAYMENTS_CURRENCY,
        method: "demo-card",
        status: "PENDING" as const,
      },
      {
        id: "demo-pay-3",
        providerTxnId: "demo_seed_0003",
        customerName: "Demo Customer",
        customerEmail: "demo@example.com",
        orderRef: "DEMO-1003",
        amountMinor: 2900n,
        currency: env.PAYMENTS_CURRENCY,
        method: "demo-card",
        status: "FAILED" as const,
      },
    ];
    for (const p of demoPayments) {
      await prisma.payment.upsert({
        where: { id: p.id },
        update: { ...p, provider: "demo" },
        create: { ...p, provider: "demo" },
      });
    }
    console.log("Seeded demo payment records (provider=demo).");
  }

  console.log("Seed complete.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
