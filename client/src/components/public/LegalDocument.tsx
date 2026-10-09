import { useEffect, useState } from "react";
import { useMeta } from "../../hooks/useMeta";
import { Reveal } from "../ui/Reveal";
import { apiRequest } from "../../lib/api";

interface BodySection {
  heading?: string;
  paragraphs?: string[];
}

interface Body {
  sections?: BodySection[];
  paragraphs?: string[];
  updated?: string;
}

interface LegalDocumentProps {
  slug: "privacy" | "terms";
  title: string;
  description: string;
  fallback: Body;
}

/** Renders a CMS-managed legal page, falling back to built-in defaults. */
export function LegalDocument({ slug, title, description, fallback }: LegalDocumentProps) {
  const [body, setBody] = useState<Body>(fallback);

  useMeta({ title: `${title} — SvapNora`, description, canonicalPath: `/${slug}` });

  useEffect(() => {
    let active = true;
    apiRequest<{ page: { body: Body } }>(`/content/pages/${slug}`)
      .then((data) => {
        if (active && data.page?.body) setBody(data.page.body);
      })
      .catch(() => {
        /* use fallback */
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <section className="container-x py-16 sm:py-24">
      <Reveal className="mx-auto max-w-3xl">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        <div className="prose-glow mt-8 text-base">
          {body.paragraphs?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {body.sections?.map((section, i) => (
            <section key={i}>
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.paragraphs?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-10 text-xs text-muted">
          This page is maintained by SvapNora and may be updated as the project evolves.
        </p>
      </Reveal>
    </section>
  );
}
