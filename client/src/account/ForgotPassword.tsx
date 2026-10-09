import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Spinner } from "../components/ui/Spinner";
import { accountApi } from "../lib/accountApi";
import { ApiError } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await accountApi.forgotPassword(email.trim());
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Reset your password"
      subtitle="Enter your email and we'll send a secure reset link if an account exists."
      footer={
        <Link to="/account/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {message ? (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-3 text-sm text-ink" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className="label">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
