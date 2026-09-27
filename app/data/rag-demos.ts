/* ------------------------------------------------------------------ */
/* RAG DEMOS — one demo page per industry                              */
/* ------------------------------------------------------------------ */
/*
 * Shared by the UI and the server (no secrets here).
 *   jaseir      → Jaseir's own knowledge (knowledge/*.md), the main chat
 *   the others  → sample industry content (knowledge/demos/<id>/*.md),
 *                 each on its own page: /rag-knowledge-assistant/demo/<id>/
 *
 * `cardQuestion` is identical to the matching industry card's `question`
 * in rag-page.ts. The card's "Try it live" link opens the demo page with
 * ?q=<cardQuestion>, and it is pre-answered by `npm run rag:warm`.
 */

import { ragDemo, ragIndustries } from "./rag-page";

export type DemoId = "jaseir" | "saas" | "ecommerce" | "clinic" | "realestate" | "legal" | "salon";
export type IndustryDemoId = Exclude<DemoId, "jaseir">;

export type Demo = {
  id: DemoId;
  /** Sample industry content (shows the "Sample content · demo" label). */
  sample: boolean;
  /** Knowledge folder, relative to the project root. */
  dir: string;
  /** Tenant name stored in the database. */
  tenantName: string;
  /** Who the assistant speaks for, in the answer prompt (generic, no brand). */
  promptSubject: string;
  title: string;
  status: string;
  greeting: string;
  starters: { icon: string; text: string }[];
  followUps: string[];
  /** Demo pages: floating question bubbles on the photo (cached like the starters). */
  bubbles?: string[];
  /**
   * Demo pages: one suggested question that is outside the sample content, so
   * it always gets the human handoff. Checked to score below RAG_MIN_CONFIDENCE
   * (0.50): the backend hands off after retrieval, without an LLM call.
   */
  handoffQuestion?: string;
  cardQuestion?: string;
};

/** Extra fields for the industry demo pages. */
export type IndustryDemoPage = {
  /** Matching industry card id in rag-page.ts (accent, icon, description, checklist). */
  industryId: string;
  /** Upper-case label, e.g. "CLINIC" → "CLINIC DEMO · SAMPLE CONTENT". */
  label: string;
  /** "Want this for your {noun}?" */
  noun: string;
  /** Image path without extension: .webp is used if present, else .jpg, else a gradient. */
  image: { src: string; alt: string };
  /** Optional note under the description, e.g. "not legal or tax advice". */
  note?: string;
  /** Chat panel accent (user bubble, send button, active tab). ≥ 4.5:1 with white text. */
  chatAccent: string;
};

const cardQuestion = (industryId: string) => {
  const question = ragIndustries.items.find((item) => item.id === industryId)?.question;
  if (!question) throw new Error(`rag-demos: no industry card "${industryId}"`);
  return question;
};

export const ragDemos: Record<DemoId, Demo> = {
  jaseir: {
    id: "jaseir",
    sample: false,
    dir: "knowledge",
    tenantName: "Jaseir",
    promptSubject: "Jaseir",
    title: ragDemo.title,
    status: ragDemo.status,
    greeting: ragDemo.greeting,
    starters: ragDemo.suggestions,
    followUps: ragDemo.followUps,
  },
  saas: {
    id: "saas",
    sample: true,
    dir: "knowledge/demos/saas",
    tenantName: "SaaS demo (sample content)",
    promptSubject: "a SaaS project-management app",
    title: "SaaS Support Assistant",
    status: "Online · answers from help-center articles",
    greeting: "Hi! Ask me about getting started, integrations, plans or troubleshooting in the app.",
    starters: [
      { icon: "chat", text: cardQuestion("saas") },
      { icon: "pricing", text: "What plans do you offer?" },
      { icon: "search", text: "Why aren't my tasks syncing?" },
    ],
    followUps: ["Is there a free trial?", "How do I contact support?", "Can I cancel anytime?"],
    bubbles: [
      "How do I connect my Google Calendar?",
      "What plans do you offer?",
      "Is there a free trial?",
      "Why aren't my tasks syncing?",
      "How do I contact support?",
    ],
    handoffQuestion: "Will you sign an NDA with us?", // retrieval confidence ≈ 0.42
    cardQuestion: cardQuestion("saas"),
  },
  ecommerce: {
    id: "ecommerce",
    sample: true,
    dir: "knowledge/demos/ecommerce",
    tenantName: "Ecommerce demo (sample content)",
    promptSubject: "an online clothing and home store",
    title: "Online Store Assistant",
    status: "Online · answers from store policies",
    greeting: "Hi! Ask me about sizes, shipping, returns or payments at the store.",
    starters: [
      { icon: "cart", text: cardQuestion("ecommerce") },
      { icon: "clock", text: "How long does shipping take?" },
      { icon: "search", text: "How do I find my size?" },
    ],
    followUps: ["How do I track my order?", "Can I exchange for a different size?", "Which payment methods do you accept?"],
    bubbles: [
      "Can I return an item after 10 days?",
      "How long does shipping take?",
      "How do I find my size?",
      "How do I track my order?",
      "Which payment methods do you accept?",
    ],
    handoffQuestion: "Can you ship to Antarctica?", // retrieval confidence ≈ 0.46
    cardQuestion: cardQuestion("ecommerce"),
  },
  clinic: {
    id: "clinic",
    sample: true,
    dir: "knowledge/demos/clinic",
    tenantName: "Clinic demo (sample content)",
    promptSubject: "a family and dental clinic",
    title: "Clinic Assistant",
    status: "Online · answers from clinic documents",
    greeting: "Hi! Ask me about tests, timings, appointments or insurance at the clinic.",
    starters: [
      { icon: "health", text: cardQuestion("clinics") },
      { icon: "clock", text: "What are your opening hours?" },
      { icon: "policy", text: "Do you accept insurance?" },
    ],
    followUps: ["How do I get my test results?", "How much is a dental check-up?", "Can I cancel my appointment?"],
    bubbles: [
      "Do I need to fast before a blood sugar test?",
      "What are your opening hours?",
      "Do you accept insurance?",
      "How do I get my test results?",
      "How much is a dental check-up?",
    ],
    handoffQuestion: "Which medicine should I take for my headache?", // retrieval confidence ≈ 0.43
    cardQuestion: cardQuestion("clinics"),
  },
  realestate: {
    id: "realestate",
    sample: true,
    dir: "knowledge/demos/realestate",
    tenantName: "Real estate demo (sample content)",
    promptSubject: "a residential property developer",
    title: "Real Estate Assistant",
    status: "Online · answers from the project brochure",
    greeting: "Hi! Ask me about the project, prices, floor plans or site visits.",
    starters: [
      { icon: "building", text: cardQuestion("real-estate") },
      { icon: "pricing", text: "How much is a 2-bedroom apartment?" },
      { icon: "clock", text: "How do I book a site visit?" },
    ],
    followUps: ["What's included in the apartment?", "What is the payment plan?", "Is there a warranty?"],
    bubbles: [
      "Is the project approved, and when is the handover date?",
      "How much is a 2-bedroom apartment?",
      "How do I book a site visit?",
      "What is the payment plan?",
      "Is there a warranty?",
    ],
    handoffQuestion: "Can you lower the price by $50k?", // retrieval confidence ≈ 0.47
    cardQuestion: cardQuestion("real-estate"),
  },
  legal: {
    id: "legal",
    sample: true,
    dir: "knowledge/demos/legal",
    tenantName: "Law & accounting demo (sample content)",
    promptSubject: "a law and accounting firm",
    title: "Law & Accounting Assistant",
    status: "Online · answers from firm documents",
    greeting: "Hi! Ask me about document checklists, filing dates, services or fees at the firm.",
    starters: [
      { icon: "file", text: cardQuestion("law-accounting") },
      { icon: "clock", text: "When is the filing deadline?" },
      { icon: "pricing", text: "How much is a personal tax return?" },
    ],
    followUps: ["Do you send reminders?", "How do I become a client?", "Is my information confidential?"],
    bubbles: [
      "Which documents do you need for my annual tax filing?",
      "When is the filing deadline?",
      "How much is a personal tax return?",
      "Do you send reminders?",
      "How do I become a client?",
    ],
    handoffQuestion: "Should I set up a company or stay a sole trader?", // retrieval confidence ≈ 0.41
    cardQuestion: cardQuestion("law-accounting"),
  },
  salon: {
    id: "salon",
    sample: true,
    dir: "knowledge/demos/salon",
    tenantName: "Salon demo (sample content)",
    promptSubject: "a hair, beauty and spa salon",
    title: "Salon Assistant",
    status: "Online · answers from the salon's service guide",
    greeting: "Hi! Ask me about services, prices, bookings or aftercare at the salon.",
    starters: [
      { icon: "scissors", text: cardQuestion("salons") },
      { icon: "pricing", text: "How much is a women's cut?" },
      { icon: "clock", text: "What is your cancellation policy?" },
    ],
    followUps: ["What are your opening hours?", "Can I choose my stylist?", "How should I care for coloured hair?"],
    bubbles: [
      "Do I need a patch test before hair colour?",
      "How much is a women's cut?",
      "What is your cancellation policy?",
      "What are your opening hours?",
      "Can I choose my stylist?",
    ],
    handoffQuestion: "Can you sponsor our charity event?", // retrieval confidence ≈ 0.48
    cardQuestion: cardQuestion("salons"),
  },
};

export const ragDemoPages: Record<IndustryDemoId, IndustryDemoPage> = {
  saas: {
    industryId: "saas",
    label: "SAAS",
    noun: "SaaS product",
    image: { src: "/images/industries/saas-1", alt: "Laptop showing an analytics dashboard on a glass desk" },
    chatAccent: "#2563eb",
  },
  ecommerce: {
    industryId: "ecommerce",
    label: "ECOMMERCE",
    noun: "online store",
    image: { src: "/images/industries/ecommerce-1", alt: "Cardboard shipping box on a white table" },
    chatAccent: "#c2410c",
  },
  clinic: {
    industryId: "clinics",
    label: "CLINIC",
    noun: "clinic",
    image: { src: "/images/industries/clinic-1", alt: "Bright clinic reception and waiting area" },
    chatAccent: "#4f46e5",
  },
  realestate: {
    industryId: "real-estate",
    label: "REAL ESTATE",
    noun: "real estate business",
    image: { src: "/images/industries/realestate-1", alt: "Modern apartment building against a blue sky" },
    chatAccent: "#0f766e",
  },
  legal: {
    industryId: "law-accounting",
    label: "LAW & ACCOUNTING",
    noun: "firm",
    image: { src: "/images/industries/legal-1", alt: "Desk with documents, a calculator and a laptop" },
    chatAccent: "#6d28d9",
    note: "Sample content, not legal or tax advice.",
  },
  salon: {
    industryId: "salons",
    label: "SALON",
    noun: "salon",
    image: { src: "/images/industries/salon-1", alt: "Modern hair salon interior with styling chairs" },
    chatAccent: "#be185d",
  },
};

export const DEMO_IDS = Object.keys(ragDemos) as DemoId[];
export const INDUSTRY_DEMO_IDS = Object.keys(ragDemoPages) as IndustryDemoId[];

export const isDemoId = (value: unknown): value is DemoId =>
  typeof value === "string" && (DEMO_IDS as string[]).includes(value);

export const isIndustryDemoId = (value: unknown): value is IndustryDemoId =>
  typeof value === "string" && (INDUSTRY_DEMO_IDS as string[]).includes(value);

/** Industry card id → demo id (only the cards that have a live demo). */
export const DEMO_BY_INDUSTRY: Record<string, IndustryDemoId> = {
  saas: "saas",
  ecommerce: "ecommerce",
  clinics: "clinic",
  "real-estate": "realestate",
  "law-accounting": "legal",
  salons: "salon",
};

/** URL of a demo page, optionally auto-sending a question (?q=). */
export const demoPageUrl = (id: IndustryDemoId, question?: string) =>
  `/rag-knowledge-assistant/demo/${id}/${question ? `?q=${encodeURIComponent(question)}` : ""}`;

export const demoSampleLabel = "Sample content · demo";
/** Chat disclaimer on the demo pages. */
export const demoDisclaimer = "Answers only from this business's content.";

/** Every preset question a demo shows (all are cached by `npm run rag:warm`). */
export function presetQuestions(id: DemoId): string[] {
  const demo = ragDemos[id];
  const extra = id === "jaseir" ? [ragDemo.autoplayQuestion] : [];
  const handoff = demo.handoffQuestion ? [demo.handoffQuestion] : [];
  return [...new Set([...extra, ...demo.starters.map((s) => s.text), ...demo.followUps, ...(demo.bubbles ?? []), ...handoff])];
}

/* ---------------- Demo page copy (shared by all industry demo pages) ---------------- */

export const demoPageCopy = {
  allIndustries: "All industries",
  showPhoto: "Show photo",
  showSource: "Show source",
  sourceTitle: "Source document",
  usedTag: "Used for this answer",
  bubblesLabel: "Try a question",
  // Knowledge tab count under each document ({n} = sections).
  topics: "{n} topic{s}",
  // Small pill under each answer.
  answeredFrom: "Answered from {k} source{s} · {seconds}s",
  // Handoff card in the chat (below the confidence threshold).
  handoff: {
    message: "I'd rather not guess. Let me connect you with the team.",
    talk: "Talk to a person",
    whatsapp: "WhatsApp",
  },
  // Chat thinking steps on demo pages ({where} = "Document › Section").
  thinking: {
    searching: "Searching {n} topics",
    found: "Found in {where}",
    writing: "Writing answer",
  },
  beforeAfter: {
    title: "Before and after",
    before: "Before",
    after: "With a RAG assistant",
    rows: [
      ["Customers wait for a reply", "Instant answers, 24/7"],
      ["Same questions every day", "Answered from your own documents"],
      ["Staff dig through files", "Every answer shows its source"],
    ] as [string, string][],
  },
  otherTitle: "Try another industry",
  ctaTitle: "Want this for your {noun}?",
  ctaButton: "Get this for your business",
};
