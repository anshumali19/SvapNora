import type { LucideIcon } from "lucide-react";

export function AuthShell({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="glow-orb -top-24 left-1/2 h-64 w-64 -translate-x-1/2 bg-accent/20" aria-hidden />
      <div className="panel relative w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex rounded-full border border-line bg-surface-2 p-2.5 text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-5 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
