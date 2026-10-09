import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { useUserAuth } from "./UserAuthProvider";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

export default function Register() {
  const { user, loading, register } = useUserAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!loading && user) return <Navigate to="/account" replace />;

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
    if (!consent) {
      setError("Please agree to the privacy notice to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        consent: true,
        ...(company.trim() ? { company: company.trim() } : {}),
      });
      if (result.authenticated) {
        navigate("/account", { replace: true });
      } else {
        setSentTo(email.trim());
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        icon={UserPlus}
        title="Check your email"
        subtitle={`We sent a verification link to ${sentTo}. Click it to activate your account.`}
        footer={
          <>
            Wrong address?{" "}
            <button type="button" className="text-accent hover:underline" onClick={() => setSentTo(null)}>
              Try again
            </button>
          </>
        }
      >
        <p className="text-center text-sm text-muted">
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <Link to="/account/forgot-password" className="text-accent hover:underline">
            request a new link
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={UserPlus}
      title="Create your account"
      subtitle="Track projects, access deliverables and manage your engagement with SvapNora."
      footer={
        <>
          Already registered?{" "}
          <Link to="/account/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reg-name" className="label">
            Full name
          </label>
          <input
            id="reg-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="label">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="reg-company" className="label">
            Company <span className="text-muted">(optional)</span>
          </label>
          <input
            id="reg-company"
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="label">
            Password
          </label>
          <input
            id="reg-password"
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
          <label htmlFor="reg-confirm" className="label">
            Confirm password
          </label>
          <input
            id="reg-confirm"
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link to="/privacy" className="text-accent hover:underline">
              privacy notice
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-accent hover:underline">
              terms
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner className="h-4 w-4" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
