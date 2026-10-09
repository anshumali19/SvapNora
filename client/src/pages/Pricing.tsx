import { Link } from "react-router-dom";
import { ArrowRight, CircleDollarSign, Handshake, MessagesSquare } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";

export default function Pricing() {
  useMeta({
    title: "Services & pricing — SvapNora",
    description:
      "SvapNora has not published a public price list. GlowLang is under active development and commercial offerings are not yet finalised.",
    canonicalPath: "/pricing",
  });

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-3">Services &amp; pricing</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              We have not published <span className="text-gradient">pricing yet</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              GlowLang is under active development, and SvapNora has not finalised a public price
              list. Rather than display invented figures, we are transparent about that.
            </p>
          </Reveal>
        </div>
      </section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CircleDollarSign,
              title: "No published prices",
              text: "There is no public pricing to display today. Any commercial offering will be published here once it is real.",
            },
            {
              icon: Handshake,
              title: "Collaboration first",
              text: "We are open to research collaboration, partnerships and technical discussions while the project matures.",
            },
            {
              icon: MessagesSquare,
              title: "Ask us directly",
              text: "If you have a specific use case, get in touch and we can discuss it honestly.",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.05}>
              <div className="card-hover h-full p-6">
                <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                  <c.icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h2 className="mt-4 text-base font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="container-x section-y">
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Have something specific in mind?</h2>
            <p className="max-w-xl text-muted">
              Tell us about your use case and we will respond with an honest assessment.
            </p>
            <Link to="/contact" className="btn-primary">
              Contact SvapNora
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
