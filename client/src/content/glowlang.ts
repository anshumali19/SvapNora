export type CapabilityStatus = "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";

export interface Feature {
  category: string;
  title: string;
  description: string;
  status: CapabilityStatus;
}

export const HERO_CODE = `blueprint Server:
    action init(port):
        self.port = port
    end

    action start():
        let server = http.listen(self.port)
        show "GlowLang Server running on port " + self.port
    end
end

let node = Server(":8080")
node.start()`;

export const SYNTAX_CODE = `blueprint Counter:
    action init(start):
        self.value = start
    end
end

every 1 second:
    show "tick"
end

when self.value > 10:
    show "limit reached"
end`;

export const TENSOR_CODE = `let a = tensor.zeros(100000)
let b = tensor.zeros(100000)
let c = tensor.add(a, b)`;

export const WEB_CODE = `let app = web.new()

app.get("/hello", action(req):
    return web.json({ message: "hello, GlowLang" })
end)

app.listen(8080)`;

export interface Highlight {
  title: string;
  description: string;
  status: CapabilityStatus;
}

export const HIGHLIGHTS: Highlight[] = [
  {
    title: "Register-based virtual machine",
    description: "A compact bytecode VM operating over roughly 120 opcodes.",
    status: "IMPLEMENTED",
  },
  {
    title: "Multi-tiered JIT compilation",
    description: "Interpreter, baseline JIT and optimizing JIT over an SSA IR.",
    status: "IN_PROGRESS",
  },
  {
    title: "SIMD-accelerated tensor operations",
    description: "CPU tensor paths oriented toward AVX2 and SSE4.2 where supported.",
    status: "IN_PROGRESS",
  },
  {
    title: "Optional CUDA integration",
    description: "GPU acceleration path requiring compatible hardware and a matching build.",
    status: "PLANNED",
  },
  {
    title: "Native HTTP and SQLite primitives",
    description: "Built-in HTTP server primitives, SQLite bindings, Redis client and a web framework.",
    status: "IMPLEMENTED",
  },
  {
    title: "Built-in tooling and packages",
    description: "gdu package management, LSP support, debugger and inspector.",
    status: "IN_PROGRESS",
  },
];

export interface FeatureGroup {
  category: string;
  items: Feature[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    category: "Natural syntax",
    items: [
      {
        category: "Natural syntax",
        title: "Readable keywords",
        description:
          "blueprint, action, show, every, when and whenever express structure, behaviour and events in plain language.",
        status: "IMPLEMENTED",
      },
    ],
  },
  {
    category: "Runtime and memory",
    items: [
      {
        category: "Runtime and memory",
        title: "Register-based VM",
        description: "A register-based virtual machine with approximately 120 bytecode opcodes.",
        status: "IMPLEMENTED",
      },
      {
        category: "Runtime and memory",
        title: "NaN-boxed values",
        description: "Multiple runtime types packed into a single 64-bit word.",
        status: "IMPLEMENTED",
      },
      {
        category: "Runtime and memory",
        title: "Generational GC & arenas",
        description: "A generational collector alongside bump-pointer arena allocation.",
        status: "IMPLEMENTED",
      },
    ],
  },
  {
    category: "JIT compilation",
    items: [
      {
        category: "JIT compilation",
        title: "Tiered execution",
        description: "Interpretation promoting to baseline and optimizing JIT tiers.",
        status: "IN_PROGRESS",
      },
      {
        category: "JIT compilation",
        title: "SSA IR & guards",
        description:
          "Loop optimizations and polymorphic inline caching with speculative guards and safe deoptimization.",
        status: "IN_PROGRESS",
      },
    ],
  },
  {
    category: "AI/ML and tensors",
    items: [
      {
        category: "AI/ML and tensors",
        title: "Vectorized CPU tensors",
        description: "Tensor operations oriented toward AVX2/SSE4.2 where the hardware and build allow.",
        status: "IN_PROGRESS",
      },
      {
        category: "AI/ML and tensors",
        title: "Autograd & neural modules",
        description: "Automatic differentiation and neural network building blocks via glowtorch and ai.glow.",
        status: "IN_PROGRESS",
      },
      {
        category: "AI/ML and tensors",
        title: "Optional CUDA",
        description: "GPU acceleration requiring compatible hardware and a correctly configured build.",
        status: "PLANNED",
      },
    ],
  },
  {
    category: "Web and databases",
    items: [
      {
        category: "Web and databases",
        title: "HTTP, SQLite, Redis",
        description: "HTTP primitives, SQLite bindings, a Redis client and a lightweight web framework.",
        status: "IMPLEMENTED",
      },
      {
        category: "Web and databases",
        title: "Threads & whenever",
        description: "Thread spawning combined with reactive whenever behaviour.",
        status: "IMPLEMENTED",
      },
    ],
  },
  {
    category: "Developer ecosystem",
    items: [
      {
        category: "Developer ecosystem",
        title: "gdu package manager",
        description: "Semantic versioning, dependency resolution and SHA-256 integrity verification.",
        status: "IMPLEMENTED",
      },
      {
        category: "Developer ecosystem",
        title: "LSP & editor support",
        description: "Language Server Protocol, editor integrations, debugger, profiler and a WebAssembly playground.",
        status: "IN_PROGRESS",
      },
    ],
  },
];

export interface RoadmapEntry {
  category: string;
  title: string;
  description: string;
  status: CapabilityStatus;
}

export const ROADMAP: RoadmapEntry[] = [
  {
    category: "Core language and runtime",
    title: "Grammar, VM and memory management",
    description:
      "Continued refinement of the lexer, parser, AST, register-based VM, NaN-boxed values and the generational collector with arena allocation.",
    status: "IMPLEMENTED",
  },
  {
    category: "JIT and optimization",
    title: "Tiered JIT and SSA optimization",
    description:
      "Baseline and optimizing JIT tiers, SSA IR, loop optimizations, polymorphic inline caching and safe deoptimization guards.",
    status: "IN_PROGRESS",
  },
  {
    category: "AI/ML and accelerator support",
    title: "Tensors, autograd and GPU paths",
    description:
      "CPU vectorized tensor operations, autograd, neural network modules and optional CUDA integration.",
    status: "IN_PROGRESS",
  },
  {
    category: "Web, database and concurrency primitives",
    title: "HTTP, SQLite, Redis and threads",
    description:
      "Native HTTP primitives, SQLite bindings, a Redis client, a lightweight web framework and reactive whenever behaviour.",
    status: "IMPLEMENTED",
  },
  {
    category: "Developer tooling and editor integrations",
    title: "gdu, LSP and inspection tools",
    description:
      "Package management with integrity verification, LSP support, editor integrations, debugger, profiler and heap/bytecode inspection.",
    status: "IN_PROGRESS",
  },
  {
    category: "Production hardening and ecosystem",
    title: "Cross-platform builds and validation",
    description:
      "Cross-platform build matrix, testing, sanitizers, fuzzing, validation libraries and WebAssembly-related efforts.",
    status: "IN_PROGRESS",
  },
  {
    category: "Future research and innovations",
    title: "Exploratory directions",
    description:
      "Research into broader accelerator support, advanced optimizations and new developer experiences. These are exploratory and not committed deliverables.",
    status: "RESEARCH",
  },
];

export interface Milestone {
  phase: string;
  title: string;
  description: string;
  status: CapabilityStatus;
}

export const MILESTONES: Milestone[] = [
  {
    phase: "The beginning",
    title: "An idea",
    description:
      "The vision of making programming syntax more natural and approachable while keeping full control over runtime design and systems-level execution.",
    status: "IMPLEMENTED",
  },
  {
    phase: "Building the foundation",
    title: "Lexer, parser and VM",
    description:
      "Constructing the lexer, parser, AST, register-based VM, value representation, garbage collector and allocator.",
    status: "IMPLEMENTED",
  },
  {
    phase: "Making execution smarter",
    title: "Tiered JIT and optimization",
    description:
      "Moving from interpretation toward tiered JIT compilation, an SSA intermediate representation, optimization and speculative deoptimization.",
    status: "IN_PROGRESS",
  },
  {
    phase: "Expanding into AI/ML",
    title: "Tensors and acceleration",
    description:
      "Adding tensor operations, CPU vectorization, optional CUDA integration and neural network capabilities.",
    status: "IN_PROGRESS",
  },
  {
    phase: "Building beyond the language",
    title: "Web, databases and tooling",
    description:
      "Networking and database primitives, concurrency features, package management, LSP, debugging and editor support.",
    status: "IN_PROGRESS",
  },
  {
    phase: "Hardening the ecosystem",
    title: "Cross-platform validation",
    description:
      "Cross-platform build work, testing, sanitizers, fuzzing, validation libraries and WebAssembly-related efforts.",
    status: "IN_PROGRESS",
  },
  {
    phase: "What comes next",
    title: "Future directions",
    description:
      "More complete AI/ML tooling, broader accelerator support, expanded editor integrations and a stronger package ecosystem.",
    status: "PLANNED",
  },
];

export interface ArchitectureLayer {
  id: string;
  name: string;
  purpose: string;
  components: string[];
  notes: string;
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "frontend",
    name: "Language frontend",
    purpose: "Turn readable GlowLang source into a structured representation.",
    components: ["Lexer", "Parser", "Diagnostics"],
    notes: "Implemented from scratch without a parser generator.",
  },
  {
    id: "pipeline",
    name: "AST and compilation pipeline",
    purpose: "Represent the program and lower it toward executable code.",
    components: ["AST", "Bytecode compiler", "~120 opcodes"],
    notes: "Compilation targets a register-based bytecode format.",
  },
  {
    id: "runtime",
    name: "Runtime and memory management",
    purpose: "Execute bytecode and manage values efficiently.",
    components: ["Register VM", "NaN-boxed values", "Generational GC", "Arena allocator"],
    notes: "Memory management combines a generational collector with bump-pointer arenas.",
  },
  {
    id: "jit",
    name: "JIT and optimization",
    purpose: "Improve execution as programs run.",
    components: ["Baseline JIT", "Optimizing JIT", "SSA IR", "Inline caches", "Deopt guards"],
    notes: "In progress: promotion thresholds and performance depend on the implementation and workload.",
  },
  {
    id: "ai",
    name: "AI/ML and hardware acceleration",
    purpose: "Provide tensor and neural network capabilities.",
    components: ["Tensor ops", "AVX2/SSE4.2 paths", "Autograd", "Optional CUDA"],
    notes: "CPU vectorization depends on supported hardware and build; CUDA is optional and requires compatible hardware.",
  },
  {
    id: "network",
    name: "Networking, databases and concurrency",
    purpose: "Build connected, data-driven programs.",
    components: ["HTTP primitives", "SQLite", "Redis client", "Threads", "whenever"],
    notes: "Native primitives with a lightweight web framework and reactive whenever behaviour.",
  },
  {
    id: "tools",
    name: "Developer tools and ecosystem",
    purpose: "Support development, packaging and inspection.",
    components: ["gdu", "LSP", "Editor integrations", "Debugger", "Profiler", "WASM playground"],
    notes: "gdu provides semantic versioning, dependency resolution and SHA-256 integrity verification.",
  },
];
