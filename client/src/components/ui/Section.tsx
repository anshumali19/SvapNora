import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
  actions?: ReactNode;
}

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  align = "left",
  className = "",
  actions,
}: SectionProps) {
  const centered = align === "center";
  return (
    <section id={id} className={`section-y ${className}`}>
      <div className="container-x">
        {(eyebrow || title || subtitle) && (
          <Reveal className={centered ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
            {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
            {title ? (
              <h2 className="text-3xl font-semibold sm:text-4xl md:text-[2.6rem]">{title}</h2>
            ) : null}
            {subtitle ? <p className="mt-4 text-base text-muted sm:text-lg">{subtitle}</p> : null}
            {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
          </Reveal>
        )}
        <div className={eyebrow || title || subtitle ? "mt-10 sm:mt-14" : ""}>{children}</div>
      </div>
    </section>
  );
}
