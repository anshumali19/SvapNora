import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { useUserAuth } from "./UserAuthProvider";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

export default function Login() {
  const { user, loading, login } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/account";

  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 429
            ? "Too many attempts. Please wait and try again."
            : err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      icon={LogIn}
      title="Sign in to your account"
      subtitle="Access your client portal, projects and billing history."
      footer={
        <>
          New to SvapNora?{" "}
          <Link to="/account/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="label">
              Password
            </label>
            <Link to="/account/forgot-password" className="text-xs text-muted hover:text-ink">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
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
    </AuthShell>
  );
}
