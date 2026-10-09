import { useState, type FormEvent } from "react";
import { Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { Section } from "../components/ui/Section";
import { Reveal } from "../components/ui/Reveal";
import { Spinner } from "../components/ui/Spinner";
import { ApiError, apiRequest } from "../lib/api";

type Category = "GENERAL" | "TECHNICAL" | "PARTNERSHIP" | "COLLABORATION";

interface FormState {
  name: string;
  email: string;
  subject: string;
  category: Category;
  message: string;
  consent: boolean;
  company: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  subject: "",
  category: "GENERAL",
  message: "",
  consent: false,
  company: "",
};

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: "GENERAL", label: "General question" },
  { value: "TECHNICAL", label: "Technical inquiry" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "COLLABORATION", label: "Collaboration" },
];

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
    errors.email = "Please enter a valid email address.";
  if (form.subject.trim().length < 3) errors.subject = "Please add a subject.";
  if (form.message.trim().length < 20)
    errors.message = "Please provide a little more detail (at least 20 characters).";
  if (!form.consent) errors.consent = "Please agree to the privacy notice.";
  return errors;
}

export default function Contact() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resultMessage, setResultMessage] = useState("");

  useMeta({
    title: "Contact — SvapNora",
    description:
      "Contact SvapNora for technical discussions, collaboration, partnerships or general questions about GlowLang and the project.",
    canonicalPath: "/contact",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setResultMessage("Please correct the highlighted fields.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await apiRequest<{ received: boolean; emailed: boolean; message: string }>(
        "/contact",
        {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            subject: form.subject,
            category: form.category,
            message: form.message,
            consent: form.consent,
            company: form.company,
          },
        },
      );
      setStatus("success");
      setResultMessage(res.message);
      setForm(INITIAL);
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.details) {
        setResultMessage(err.message);
      } else if (err instanceof ApiError) {
        setResultMessage(err.message);
      } else {
        setResultMessage("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="container-x relative py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-3">Contact</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Let's talk about <span className="text-gradient">what we're building</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              Whether you are a developer, researcher, student or potential collaborator, we would
              like to hear from you.
            </p>
          </Reveal>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <Reveal>
            <form onSubmit={onSubmit} noValidate className="panel p-6 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className={`input ${errors.name ? "input-error" : ""}`}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name ? (
                    <p id="name-error" className="field-error" role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input ${errors.email ? "input-error" : ""}`}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email ? (
                    <p id="email-error" className="field-error" role="alert">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="subject" className="label">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    className={`input ${errors.subject ? "input-error" : ""}`}
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? "subject-error" : undefined}
                  />
                  {errors.subject ? (
                    <p id="subject-error" className="field-error" role="alert">
                      {errors.subject}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="category" className="label">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="input"
                    value={form.category}
                    onChange={(e) => update("category", e.target.value as Category)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="message" className="label">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className={`input resize-y ${errors.message ? "input-error" : ""}`}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message ? (
                  <p id="message-error" className="field-error" role="alert">
                    {errors.message}
                  </p>
                ) : null}
              </div>

              {/* Honeypot (hidden from users, bots may fill it) */}
              <div className="hidden" aria-hidden>
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>

              <div className="mt-5 flex items-start gap-3">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-line bg-bg-elev text-accent focus:ring-accent"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? "consent-error" : "consent-hint"}
                />
                <div>
                  <label htmlFor="consent" className="text-sm text-muted">
                    I agree that my message may be stored and used to respond to my enquiry.
                  </label>
                  <p id="consent-hint" className="hint mt-0.5">
                    See the{" "}
                    <a href="/privacy" className="text-accent underline decoration-accent/40">
                      privacy policy
                    </a>
                    .
                  </p>
                  {errors.consent ? (
                    <p id="consent-error" className="field-error" role="alert">
                      {errors.consent}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button type="submit" className="btn-primary" disabled={status === "submitting"}>
                  {status === "submitting" ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden />
                      Send message
                    </>
                  )}
                </button>
                <p className="hint">We typically respond to genuine enquiries as soon as we can.</p>
              </div>

              <div aria-live="polite" className="mt-4">
                {status === "success" ? (
                  <p className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
                    {resultMessage}
                  </p>
                ) : null}
                {status === "error" && resultMessage ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                    {resultMessage}
                  </p>
                ) : null}
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="card p-5">
                <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                  <MessageSquare className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h2 className="mt-3 text-sm font-semibold">What to expect</h2>
                <ul className="mt-2 space-y-2 text-sm text-muted">
                  <li>Technical inquiries about GlowLang.</li>
                  <li>Partnership and collaboration discussions.</li>
                  <li>General questions from developers and students.</li>
                </ul>
              </div>
              <div className="card p-5">
                <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                  <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h2 className="mt-3 text-sm font-semibold">How your message is handled</h2>
                <p className="mt-2 text-sm text-muted">
                  Messages are stored securely and protected by rate limiting and spam checks.
                  Email delivery is used only when the SvapNora email provider is configured; if it
                  is not, your message is still received safely.
                </p>
              </div>
              <div className="card p-5">
                <span className="inline-flex rounded-xl border border-line bg-surface-2 p-2 text-accent">
                  <Mail className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h2 className="mt-3 text-sm font-semibold">Email</h2>
                <p className="mt-2 text-sm text-muted">
                  A public contact email address has not been published. Use this form and the team
                  will respond through the details you provide.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
