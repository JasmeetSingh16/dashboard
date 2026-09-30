/* ------------------------------------------------------------------ */
/* CONTACT CONFIG — edit these in one place                            */
/* ------------------------------------------------------------------ */

// WhatsApp number — country code + number,
// digits only (no "+", spaces or dashes).
export const WHATSAPP_NUMBER = "919914137278";

export const WHATSAPP_MESSAGE = "Hi Jaseir, I'd like a free RAG demo on my documents.";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// Where "Book a call" / handoff buttons go. Set in lib/site.ts (shared
// with every agent app), re-exported here for the RAG code.
export { BOOKING_URL, CONTACT_URL } from "../../lib/site";

// Shown on /privacy/ for data and deletion requests.
// TODO: replace this placeholder with your real contact email.
export const PRIVACY_EMAIL = "privacy@example.com";
