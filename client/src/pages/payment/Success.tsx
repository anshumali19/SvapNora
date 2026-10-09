import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useMeta } from "../../hooks/useMeta";

export default function PaymentSuccess() {
  useMeta({
    title: "Payment status — SvapNora",
    description: "Payment confirmation status.",
    robots: "noindex, nofollow",
  });

  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <CheckCircle2 className="h-10 w-10 text-accent" aria-hidden />
      <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Thanks — your payment is being verified</h1>
      <p className="mt-4 max-w-lg text-muted">
        A redirect alone does not confirm a payment. If you completed a transaction, the final
        status is verified securely on the server using the payment provider's signed events.
        You will receive confirmation from the provider.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
        <Link to="/contact" className="btn-secondary">
          Contact support
        </Link>
      </div>
    </section>
  );
}
