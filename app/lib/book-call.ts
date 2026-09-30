/* ------------------------------------------------------------------ */
/* BOOK A FREE CALL — form copy and validation (shared by client +     */
/* server). Used by /book-a-call/ and /api/book-call/.                 */
/* ------------------------------------------------------------------ */

export const bookCallCopy = {
  eyebrow: "Free consultation",
  title: "Book a free call",
  intro:
    "Tell us what you'd like to automate. We'll reply within one business day to set up a 30-minute call — no cost, no commitment.",
  fields: {
    name: "Name",
    email: "Email",
    phone: "WhatsApp / phone",
    website: "Company website",
    need: "What would you like an AI agent to do?",
    time: "Best time to talk",
  },
  placeholders: {
    name: "Your name",
    email: "you@company.com",
    phone: "+91 98765 43210",
    website: "company.com",
    need: "e.g. answer customer questions on WhatsApp, qualify leads from our website form, book appointments…",
    time: "e.g. weekdays after 4pm IST",
  },
  optional: "optional",
  phoneHint: "Include your country code.",
  consent: "We'll only use your details to arrange the call and follow up about it.",
  privacyLabel: "Privacy policy",
  submit: "Request my free call",
  sending: "Sending…",
  successTitle: "Thanks — we've got your request.",
  successText: "We'll email you within one business day to fix a time. Prefer WhatsApp? Message us directly:",
  whatsapp: "Chat on WhatsApp",
  error: "Sorry, something went wrong. Please try again, or message us on WhatsApp.",
  rateLimited: "You've sent a few requests already. Please try again in an hour.",
};

export type BookCallInput = { name: string; email: string; phone: string; website: string; need: string; time: string };
export type BookCallErrors = Partial<Record<keyof BookCallInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]+$/;

/** "company.com" → "https://company.com"; "" stays ""; null if unusable. */
export function normalizeSite(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function validateBookCall(input: BookCallInput): BookCallErrors {
  const errors: BookCallErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const need = input.need.trim();

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 100) errors.name = "Please use at most 100 characters.";

  if (!email) errors.email = "Please enter your email.";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Please enter a valid email, e.g. you@company.com.";

  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE.test(phone) || digits < 7 || digits > 15) errors.phone = "Please enter a valid number with country code.";
  }

  if (input.website.trim().length > 200 || normalizeSite(input.website) === null) {
    errors.website = "Please enter a valid website, e.g. company.com.";
  }

  if (!need) errors.need = "Please tell us briefly what you need.";
  else if (need.length > 1500) errors.need = "Please keep it under 1500 characters.";

  if (input.time.trim().length > 200) errors.time = "Please keep it under 200 characters.";

  return errors;
}
