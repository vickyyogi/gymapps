import "server-only";

import { log } from "@/lib/log";

export type EmailContent = { subject: string; text: string };

export function emailEnabled() {
  return Boolean(process.env.EMAIL_API_KEY);
}

export function appUrl(path: string) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

// Resend-compatible REST: POST {base}/emails with Bearer key. Any provider
// exposing the same shape works via EMAIL_PROVIDER_BASE_URL.
export async function sendEmail(input: { to: string } & EmailContent) {
  const base = process.env.EMAIL_PROVIDER_BASE_URL ?? "https://api.resend.com";
  const response = await fetch(`${base}/emails`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      text: input.text
    })
  });
  if (!response.ok) {
    log("warn", "email_send_failed", { status: response.status, to: maskEmail(input.to) });
    throw new Error(`email_send_failed_${response.status}`);
  }
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${(local ?? "").slice(0, 2)}***@${domain ?? ""}`;
}

const TEMPLATES: Record<
  "verify_email" | "reset_password",
  Record<"id" | "en", (link: string) => EmailContent>
> = {
  verify_email: {
    id: (link) => ({
      subject: "Verifikasi email GymApps kamu",
      text: [
        "Hai,",
        "",
        "Verifikasi email kamu untuk mulai memakai GymApps:",
        link,
        "",
        "Link berlaku 24 jam. Jika kamu tidak mendaftar di GymApps, abaikan email ini."
      ].join("\n")
    }),
    en: (link) => ({
      subject: "Verify your GymApps email",
      text: [
        "Hi,",
        "",
        "Verify your email to start using GymApps:",
        link,
        "",
        "The link is valid for 24 hours. If you did not sign up for GymApps, ignore this email."
      ].join("\n")
    })
  },
  reset_password: {
    id: (link) => ({
      subject: "Reset password GymApps",
      text: [
        "Hai,",
        "",
        "Atur ulang password kamu:",
        link,
        "",
        "Link berlaku 60 menit dan hanya bisa dipakai sekali. Jika kamu tidak meminta reset, abaikan email ini."
      ].join("\n")
    }),
    en: (link) => ({
      subject: "Reset your GymApps password",
      text: [
        "Hi,",
        "",
        "Reset your password:",
        link,
        "",
        "The link is valid for 60 minutes and can only be used once. If you did not request a reset, ignore this email."
      ].join("\n")
    })
  }
};

export function renderEmail(
  purpose: keyof typeof TEMPLATES,
  locale: string,
  link: string
): EmailContent {
  return TEMPLATES[purpose][locale === "en" ? "en" : "id"](link);
}
