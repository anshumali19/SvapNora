import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";
import { logger } from "../logger";

let transporter: Transporter | null = null;

/**
 * True when an email transport is configured. Supports SMTP (for hosts that
 * allow outbound SMTP) and the Brevo HTTP API (for hosts such as Render's free
 * tier that block outbound SMTP ports 25/465/587 but allow HTTPS).
 */
function emailTransportReady(): boolean {
  if (env.EMAIL_PROVIDER === "smtp") return Boolean(env.SMTP_HOST);
  if (env.EMAIL_PROVIDER === "brevo") return Boolean(env.BREVO_API_KEY);
  return false;
}

function getTransporter(): Transporter | null {
  if (env.EMAIL_PROVIDER !== "smtp") return null;
  if (transporter) return transporter;
  if (!env.SMTP_HOST) {
    logger.warn("EMAIL_PROVIDER=smtp but SMTP_HOST is not configured; email disabled.");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/** Parse a `Name <email@host>` or bare `email@host` sender string. */
function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || undefined, email: (match[2] ?? "").trim() };
  return { email: from.trim() };
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Deliver via the Brevo transactional email HTTP API (port 443). */
async function sendViaBrevo(message: MailMessage): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseFrom(env.EMAIL_FROM),
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        ...(message.html ? { htmlContent: message.html } : {}),
        ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error(
        { status: response.status, body, subject: message.subject },
        "failed to send email via Brevo",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, subject: message.subject }, "failed to send email via Brevo");
    return false;
  }
}

/** Single delivery entry point that dispatches to the configured transport. */
async function deliver(message: MailMessage): Promise<boolean> {
  if (env.EMAIL_PROVIDER === "brevo") return sendViaBrevo(message);
  const tx = getTransporter();
  if (!tx) return false;
  try {
    await tx.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      replyTo: message.replyTo,
      html: message.html,
    });
    return true;
  } catch (err) {
    logger.error({ err, subject: message.subject }, "failed to send email");
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return emailTransportReady() && Boolean(env.CONTACT_TO_EMAIL);
}

/** True when a transport is usable for transactional mail (no inbox needed). */
export function isTransactionalEmailConfigured(): boolean {
  return emailTransportReady();
}

async function sendMail(message: MailMessage): Promise<boolean> {
  return deliver(message);
}

export interface ContactEmail {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

/**
 * Send a contact-form notification. Returns true when delivered, false when
 * email is not configured or delivery fails (the submission is always stored).
 */
export async function sendContactNotification(payload: ContactEmail): Promise<boolean> {
  if (!emailTransportReady() || !env.CONTACT_TO_EMAIL) return false;
  return deliver({
    to: env.CONTACT_TO_EMAIL,
    replyTo: payload.email,
    subject: `[SvapNora Contact] ${payload.subject}`,
    text: [
      `New contact submission`,
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Category: ${payload.category}`,
      "",
      payload.message,
    ].join("\n"),
  });
}

export async function sendVerificationEmail(to: string, name: string, url: string): Promise<boolean> {
  return sendMail({
    to,
    subject: "Verify your SvapNora account",
    text: [
      `Hi ${name},`,
      "",
      "Confirm your email address to activate your SvapNora account:",
      url,
      "",
      "If you did not create this account you can ignore this message.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, url: string): Promise<boolean> {
  return sendMail({
    to,
    subject: "Reset your SvapNora password",
    text: [
      `Hi ${name},`,
      "",
      "Use the link below to choose a new password:",
      url,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
  });
}

export async function sendClientWelcomeEmail(
  to: string,
  name: string,
  options: { temporaryPassword?: string; resetUrl?: string },
): Promise<boolean> {
  const lines = [
    `Hi ${name},`,
    "",
    "A SvapNora client account has been created for you.",
  ];
  if (options.temporaryPassword) {
    lines.push("", `Temporary password: ${options.temporaryPassword}`, "Please change it after signing in.");
  }
  if (options.resetUrl) {
    lines.push("", "You can also set your own password here:", options.resetUrl);
  }
  lines.push("", "Sign in at your SvapNora account page.");
  return sendMail({ to, subject: "Your SvapNora client account", text: lines.join("\n") });
}
