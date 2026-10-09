import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import { Logo } from "../components/public/Logo";

export function Login() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 429
            ? "Too many attempts. Please wait and try again."
            : err.message,
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="glow-orb -top-24 left-1/2 h-64 w-64 -translate-x-1/2 bg-accent/20" aria-hidden />
      <div className="panel relative w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9" />
          <span className="mt-5 inline-flex rounded-full border border-line bg-surface-2 p-2.5 text-accent">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Administrator sign in</h1>
          <p className="mt-1 text-sm text-muted">
            This area is restricted to authorised SvapNora administrators.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="label">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Access is validated on the server. Sessions expire automatically.
        </p>
      </div>
    </div>
  );
}
