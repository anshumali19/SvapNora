import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useMeta } from "../hooks/useMeta";

export default function NotFound() {
  useMeta({
    title: "Page not found — SvapNora",
    description: "The page you are looking for could not be found.",
    robots: "noindex, follow",
  });

  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <span className="eyebrow mb-4">404</span>
      <Compass className="h-10 w-10 text-accent" aria-hidden />
      <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">This page drifted off the grid</h1>
      <p className="mt-4 max-w-md text-muted">
        The page you were looking for does not exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
        <Link to="/glowlang" className="btn-secondary">
          Explore GlowLang
        </Link>
        <Link to="/contact" className="btn-ghost">
          Contact us
        </Link>
      </div>
    </section>
  );
}
