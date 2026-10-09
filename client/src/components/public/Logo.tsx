export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-full w-auto" role="img" aria-label="SvapNora logo">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#4f7cff" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" className="fill-surface-2" />
        <path
          d="M19 22c0-3.3 3.4-5.4 6.4-4L40 26c3.4 1.7 3.4 6.4 0 8.1L25.4 42c-3 1.4-6.4-.7-6.4-4V22z"
          fill="none"
          stroke="url(#logo-grad)"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        <circle cx="43" cy="43" r="4.5" fill="url(#logo-grad)" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink">
        Svap<span className="text-gradient">Nora</span>
      </span>
    </span>
  );
}
