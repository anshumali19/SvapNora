import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Logo } from "./Logo";

const REPO_URL = import.meta.env.VITE_REPO_URL as string | undefined;
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/glowlang", label: "GlowLang" },
      { to: "/technology", label: "Technology" },
      { to: "/roadmap", label: "Roadmap" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "Our Story" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-line bg-bg-elev/60">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo className="h-8" />
            <p className="mt-4 max-w-sm text-sm text-muted">
              SvapNora is an engineering-driven company building developer tools and language
              infrastructure. GlowLang is our programming language, engineered from the ground up in C.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {REPO_URL ? (
                <a
                  href={REPO_URL}
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github className="h-4 w-4" aria-hidden />
                  Source code
                </a>
              ) : null}
              {CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-muted hover:text-ink">
                  {CONTACT_EMAIL}
                </a>
              ) : null}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>© {year} SvapNora. All rights reserved.</p>
          <p>
            GlowLang feature and roadmap statuses are indicative and updated as development
            progresses.
          </p>
        </div>
      </div>
    </footer>
  );
}
