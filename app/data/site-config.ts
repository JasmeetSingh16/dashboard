/* ------------------------------------------------------------------ */
/* CONTACT CONFIG — edit these in one place                            */
/* ------------------------------------------------------------------ */

// WhatsApp number — country code + number,
// digits only (no "+", spaces or dashes).
export const WHATSAPP_NUMBER = "919914137278";

export const WHATSAPP_MESSAGE = "Hi Jaseir, I'd like a free RAG demo on my documents.";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CONTACT_URL = "https://www.jaseir.com/contact/";

// Where "Book a call" / handoff buttons go. Replace with your Calendly or
// Cal.com link when you have one.
export const BOOKING_URL = CONTACT_URL;
