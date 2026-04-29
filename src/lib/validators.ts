import { z } from "zod";

export type ScanType = "url" | "email" | "phone" | "image";

export const urlSchema = z
  .string()
  .trim()
  .min(3, "URL is too short")
  .max(2048, "URL is too long");

export const emailContentSchema = z
  .string()
  .trim()
  .min(10, "Paste at least a few words from the message")
  .max(8000, "Message is too long (max 8000 chars)");

export const phoneSchema = z
  .string()
  .trim()
  .min(5, "Phone number is too short")
  .max(32, "Phone number is too long");

/** Normalize a URL: add https:// if missing, lowercase host, strip whitespace. */
export function normalizeUrl(raw: string): string {
  let v = raw.trim();
  if (!v) return v;
  // Remove zero-width / control chars
  v = v.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return v;
  }
}

/** Normalize a phone number to a compact E.164-ish form (best effort). */
export function normalizePhone(raw: string): string {
  let v = raw.trim();
  // Keep leading + and digits only
  const hasPlus = v.startsWith("+");
  v = v.replace(/[^\d]/g, "");
  return (hasPlus ? "+" : "") + v;
}

export function validate(type: ScanType, input: string): { ok: true; value: string } | { ok: false; error: string } {
  if (type === "url") {
    const r = urlSchema.safeParse(input);
    if (!r.success) return { ok: false, error: r.error.issues[0].message };
    return { ok: true, value: normalizeUrl(r.data) };
  }
  if (type === "email") {
    const r = emailContentSchema.safeParse(input);
    if (!r.success) return { ok: false, error: r.error.issues[0].message };
    return { ok: true, value: r.data };
  }
  if (type === "phone") {
    const r = phoneSchema.safeParse(input);
    if (!r.success) return { ok: false, error: r.error.issues[0].message };
    const normalized = normalizePhone(r.data);
    if (normalized.replace(/\D/g, "").length < 5) return { ok: false, error: "Not enough digits in phone number" };
    return { ok: true, value: normalized };
  }
  return { ok: true, value: input };
}

export type Preset = { label: string; value: string; hint: string };

export const presets: Record<Exclude<ScanType, "image">, Preset[]> = {
  url: [
    { label: "Lookalike PayPal", value: "https://secure-paypa1-login.com/verify", hint: "Typosquatted brand" },
    { label: "Real bank", value: "https://www.chase.com", hint: "Likely safe" },
    { label: "IP-based host", value: "http://192.168.13.7/login.php?token=xyz", hint: "Raw IP" },
    { label: "Shortener", value: "https://bit.ly/3xY9z2K", hint: "Hidden destination" },
  ],
  email: [
    {
      label: "Amazon billing scam",
      value:
        "From: support@amaz0n-billing.com\nSubject: Urgent: Verify your account\n\nDear customer, your account has been suspended due to unusual activity. Click here within 24 hours to verify: http://amaz0n-billing.com/verify",
      hint: "Urgency + lookalike domain",
    },
    {
      label: "CEO gift-card request",
      value:
        "From: ceo@company-co.help\nSubject: Quick favor\n\nHi, are you at your desk? I need you to grab some Apple gift cards for a client right now. I'm in a meeting, just reply here.",
      hint: "Social engineering",
    },
    {
      label: "Newsletter (legit)",
      value:
        "From: news@notion.so\nSubject: Your weekly digest\n\nHere are this week's product updates and templates from the Notion team.",
      hint: "Should be safe",
    },
  ],
  phone: [
    { label: "IRS scam (US)", value: "+1 202 555 0143", hint: "Common scam pattern" },
    { label: "Premium-rate UK", value: "+44 909 8790000", hint: "Premium prefix" },
    { label: "Local mobile", value: "+1 415 555 2671", hint: "Likely benign" },
  ],
};