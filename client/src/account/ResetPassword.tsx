import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Spinner } from "../components/ui/Spinner";
import { accountApi } from "../lib/accountApi";
import { ApiError } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthShell
        icon={KeyRound}
        title="Invalid reset link"
        subtitle="This password reset link is missing its token."
        footer={
          <Link to="/account/forgot-password" className="text-accent hover:underline">
            Request a new link
          </Link>
        }
      >
        <Link to="/account/login" className="btn-primary w-full">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        icon={ShieldCheck}
        title="Password updated"
        subtitle="Your password has been reset and all other sessions were signed out."
        footer={
          <Link to="/account/login" className="text-accent hover:underline">
            Continue to sign in
          </Link>
        }
      >
        <Link to="/account/login" className="btn-primary w-full">
          Sign in
        </Link>
      </AuthShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Use a password of at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await accountApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell icon={KeyRound} title="Choose a new password" subtitle="Enter and confirm your new password below.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reset-password" className="label">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <p className="hint mt-1">At least 10 characters.</p>
        </div>
        <div>
          <label htmlFor="reset-confirm" className="label">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
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
              Updating…
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
