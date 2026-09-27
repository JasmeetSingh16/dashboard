/* ------------------------------------------------------------------ */
/* LEAD FORM — fields, copy and validation (shared by client + server)  */
/* ------------------------------------------------------------------ */

export const LEAD_INDUSTRIES = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "clinic", label: "Clinic" },
  { value: "realestate", label: "Real estate" },
  { value: "legal", label: "Law & accounting" },
  { value: "salon", label: "Salon" },
  { value: "other", label: "Other" },
] as const;

export type LeadIndustry = (typeof LEAD_INDUSTRIES)[number]["value"];

export const isLeadIndustry = (value: unknown): value is LeadIndustry =>
  LEAD_INDUSTRIES.some((option) => option.value === value);

export const leadCopy = {
  title: "Get a free demo for your business",
  intro: "Tell us a little about your business. We'll set up a demo assistant on your own documents.",
  fields: {
    name: "Name",
    email: "Work email",
    company: "Company name",
    website: "Website",
    industry: "Industry",
    phone: "WhatsApp / phone",
    message: "What should the assistant answer?",
  },
  placeholders: {
    name: "Your name",
    email: "you@company.com",
    company: "Company name",
    website: "company.com",
    phone: "+1 555 123 4567",
    message: "e.g. questions about prices, bookings, returns…",
  },
  optional: "optional",
  phoneHint: "Include your country code, e.g. +44 or +91.",
  consent: "I agree to be contacted about my request.",
  privacyLabel: "Privacy policy",
  privacyUrl: "/privacy/",
  submit: "Request my free demo",
  sending: "Sending…",
  close: "Close",
  success: "Thanks! The team will contact you shortly.",
  back: "Back to the demo",
  error: "Sorry, something went wrong on our side. Please try again in a moment.",
  rateLimited: "You've sent a few requests already. Please try again in an hour.",
  fixErrors: "Please check the highlighted fields.",
};

export type LeadInput = {
  name: string;
  email: string;
  company: string;
  website: string;
  industry: string;
  phone: string;
  message: string;
  consent: boolean;
};

export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+[\d\s().-]+$/;

/** "company.com" → "https://company.com". Returns null if it isn't a usable URL. */
export function normalizeWebsite(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Returns an error message per invalid field (empty object = valid). */
export function validateLead(input: LeadInput): LeadErrors {
  const errors: LeadErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const company = input.company.trim();
  const phone = input.phone.trim();

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 100) errors.name = "Please use at most 100 characters.";

  if (!email) errors.email = "Please enter your work email.";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Please enter a valid email, e.g. you@company.com.";

  if (!company) errors.company = "Please enter your company name.";
  else if (company.length > 120) errors.company = "Please use at most 120 characters.";

  if (input.website.trim().length > 200 || normalizeWebsite(input.website) === null) {
    errors.website = "Please enter a valid website, e.g. company.com.";
  }

  if (!isLeadIndustry(input.industry)) errors.industry = "Please choose your industry.";

  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE.test(phone) || digits < 7 || digits > 15) {
      errors.phone = "Please include the country code, e.g. +44 20 7946 0958.";
    }
  }

  if (input.message.trim().length > 1000) errors.message = "Please keep it under 1000 characters.";

  if (!input.consent) errors.consent = "Please agree so we can contact you about your request.";

  return errors;
}
