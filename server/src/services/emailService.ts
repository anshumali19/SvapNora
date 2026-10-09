import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";
import { logger } from "../logger";

let transporter: Transporter | null = null;

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

export function isEmailConfigured(): boolean {
  return env.EMAIL_PROVIDER === "smtp" && Boolean(env.SMTP_HOST) && Boolean(env.CONTACT_TO_EMAIL);
}

/** True when SMTP is usable for transactional mail (no contact inbox needed). */
export function isTransactionalEmailConfigured(): boolean {
  return env.EMAIL_PROVIDER === "smtp" && Boolean(env.SMTP_HOST);
}

async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) return false;
  try {
    await tx.sendMail({ from: env.EMAIL_FROM, ...message });
    return true;
  } catch (err) {
    logger.error({ err, subject: message.subject }, "failed to send email");
    return false;
  }
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
  const tx = getTransporter();
  if (!tx || !env.CONTACT_TO_EMAIL) return false;

  try {
    await tx.sendMail({
      from: env.EMAIL_FROM,
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
    return true;
  } catch (err) {
    logger.error({ err }, "failed to send contact notification email");
    return false;
  }
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
