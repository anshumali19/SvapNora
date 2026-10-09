import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { useMeta } from "../../hooks/useMeta";

export default function PaymentCancel() {
  useMeta({
    title: "Payment cancelled — SvapNora",
    description: "Payment cancellation status.",
    robots: "noindex, nofollow",
  });

  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <XCircle className="h-10 w-10 text-muted" aria-hidden />
      <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Payment not completed</h1>
      <p className="mt-4 max-w-lg text-muted">
        No payment was taken. If this was unexpected, you can try again or contact us.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/pricing" className="btn-primary">
          View services
        </Link>
        <Link to="/contact" className="btn-secondary">
          Contact us
        </Link>
      </div>
    </section>
  );
}
