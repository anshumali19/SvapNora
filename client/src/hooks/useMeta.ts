import { useEffect } from "react";

export interface PageMeta {
  title: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://svapnora.example";

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Manage document title and key social/SEO tags per route. */
export function useMeta(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title;
    if (meta.description) {
      upsertMeta('meta[name="description"]', "name", "description", meta.description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", meta.description);
    }
    upsertMeta('meta[property="og:title"]', "property", "og:title", meta.title);
    upsertMeta('meta[property="og:type"]', "property", "og:type", meta.ogType ?? "website");
    if (meta.robots) upsertMeta('meta[name="robots"]', "name", "robots", meta.robots);

    const path = meta.canonicalPath ?? window.location.pathname;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${path}`;

    let ld: HTMLScriptElement | null = null;
    if (meta.jsonLd) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.text = JSON.stringify(meta.jsonLd);
      document.head.appendChild(ld);
    }
    return () => {
      if (ld) document.head.removeChild(ld);
    };
  }, [meta.title, meta.description, meta.canonicalPath, meta.robots, meta.ogType, meta.jsonLd]);
}
