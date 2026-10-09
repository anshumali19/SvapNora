import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
}

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
  error: <XCircle className="h-4 w-4 text-danger" aria-hidden />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />,
  info: <Info className="h-4 w-4 text-accent-2" aria-hidden />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="panel pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3 animate-fade-up"
          >
            <span className="mt-0.5">{ICONS[t.variant]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.message ? <p className="mt-0.5 text-xs text-muted">{t.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
