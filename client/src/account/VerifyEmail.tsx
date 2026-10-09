import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MailCheck, MailWarning } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { useUserAuth } from "./UserAuthProvider";
import { Spinner } from "../components/ui/Spinner";
import { accountApi } from "../lib/accountApi";
import { ApiError } from "../lib/api";

type State = "working" | "done" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { setUser } = useUserAuth();
  const [state, setState] = useState<State>(token ? "working" : "error");
  const [message, setMessage] = useState(token ? "" : "This verification link is missing its token.");
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    accountApi
      .verifyEmail(token)
      .then((data) => {
        setUser(data.user);
        setState("done");
      })
      .catch((err) => {
        setMessage(err instanceof ApiError ? err.message : "We could not verify this link.");
        setState("error");
      });
  }, [token, setUser]);

  if (state === "working") {
    return (
      <AuthShell icon={MailCheck} title="Verifying your email" subtitle="One moment while we confirm your link.">
        <div className="flex justify-center py-4">
          <Spinner className="h-6 w-6" />
        </div>
      </AuthShell>
    );
  }

  if (state === "done") {
    return (
      <AuthShell
        icon={MailCheck}
        title="Email verified"
        subtitle="Your account is now active. You can sign in and access your portal."
        footer={
          <Link to="/account/login" className="text-accent hover:underline">
            Continue to sign in
          </Link>
        }
      >
        <Link to="/account" className="btn-primary w-full">
          Go to my dashboard
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={MailWarning}
      title="Verification failed"
      subtitle={message}
      footer={
        <>
          Need a new link?{" "}
          <Link to="/account/forgot-password" className="text-accent hover:underline">
            Request one
          </Link>
        </>
      }
    >
      <Link to="/account/login" className="btn-secondary w-full">
        Back to sign in
      </Link>
    </AuthShell>
  );
}
