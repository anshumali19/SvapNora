import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useSmoothScroll, scrollToTop } from "../../hooks/useSmoothScroll";

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollToTop(true);
  }, [pathname]);
  return null;
}

export function PublicLayout() {
  useSmoothScroll();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTopOnNavigate />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
