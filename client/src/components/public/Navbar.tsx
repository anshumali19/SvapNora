import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useUserAuth } from "../../account/UserAuthProvider";

const LINKS = [
  { to: "/glowlang", label: "GlowLang" },
  { to: "/technology", label: "Technology" },
  { to: "/about", label: "Our Story" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useUserAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line/80 bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between" aria-label="Primary">
        <Link to="/" className="shrink-0" aria-label="SvapNora home">
          <Logo className="h-8" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-ink" : "text-muted hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={user ? "/account" : "/account/login"}
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:inline-flex"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link to="/glowlang" className="btn-primary btn-sm hidden sm:inline-flex">
            Explore GlowLang
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            className="rounded-lg border border-line bg-surface/60 p-2 text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="border-t border-line bg-bg/95 backdrop-blur-xl lg:hidden"
      >
        <div className="container-x flex flex-col gap-1 py-4">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to={user ? "/account" : "/account/login"}
            className="rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            {user ? "My dashboard" : "Sign in"}
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Link to="/glowlang" className="btn-primary flex-1">
              Explore GlowLang
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
