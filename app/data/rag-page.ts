/* ------------------------------------------------------------------ */
/* RAG KNOWLEDGE ASSISTANT — PAGE COPY                                 */
/* ------------------------------------------------------------------ */
/*
 * All text for /rag-knowledge-assistant/ and the home page RAG section.
 * The demo's knowledge base lives in ./rag-knowledge-base.json.
 * The WhatsApp number and contact URL live in ./site-config.ts.
 */

import { CONTACT_URL, WHATSAPP_URL } from "./site-config";

export const ragLinks = {
  page: "/rag-knowledge-assistant/",
  canonical: "https://ai.jaseir.com/rag-knowledge-assistant/",
  contact: CONTACT_URL,
  leadQualification: "https://ai.jaseir.com/ai-lead-qualification/",
};

export const whatsappUrl = WHATSAPP_URL;

export const ragSeo = {
  title: "RAG Chatbot & RAG Development Services | Jaseir",
  description:
    "RAG chatbot for your business: answers customers and your team from your own documents, website and FAQs, with sources. RAG development services by Jaseir.",
  serviceName: "RAG Chatbot & RAG Development Services",
  serviceType: "RAG development services",
};

/* 1. HERO + LIVE DEMO --------------------------------------------- */

export const ragHero = {
  badge: "RAG ASSISTANT",
  // The H1 is split so only "RAG AI" gets the gradient.
  titleHighlight: "RAG AI",
  titleAfter: "Assistant for Your Business",
  subtitle:
    "AI that answers customers and your team from your own documents, website and FAQs, with sources for every answer.",
  features: [
    { icon: "doc", title: "Uses your sources", text: "PDFs, docs, website, SOPs, FAQs" },
    { icon: "bolt", title: "Instant, accurate answers", text: "RAG-powered with source references" },
    { icon: "policy", title: "Secure & private", text: "Your data stays yours" },
    { icon: "users", title: "Helps your team", text: "Support, sales, operations" },
  ],
  primaryCta: { label: "Try the live demo", href: "#live-demo" },
  secondaryCta: { label: "Get a free demo on your docs", href: ragLinks.contact },
  trust: [
    { icon: "clock", label: "Always on 24/7" },
    { icon: "check", label: "Answers with sources" },
    { icon: "users", label: "Hands off to humans" },
  ],
};

/* The chat panel. Everything it shows about documents, sources and answers
   comes from the live knowledge base (/api/rag/sources, /api/rag/chat). */
export const ragDemo = {
  title: "Jaseir RAG Assistant",
  status: "Online · answers from your business content",
  greeting:
    "Hi! I'm the Jaseir RAG Assistant. Ask me about Jaseir's services, setup, integrations, pricing or data privacy — every answer comes from Jaseir's own documents, with sources.",
  // Typed into the chat and answered automatically when the page loads.
  autoplayQuestion: "How long does setup take?",
  // Shown until the visitor asks something themselves (all cached: no AI call).
  suggestions: [
    { icon: "doc", text: "What sources can you use?" },
    { icon: "lock", text: "Is my data safe?" },
    { icon: "search", text: "How does it work?" },
  ],
  // After each answer, 2 not-yet-asked questions from this list are offered.
  followUps: [
    "Can you integrate with HubSpot?",
    "How long does setup take?",
    "What happens if the AI doesn't know?",
    "Does it work on WhatsApp?",
    "Can I try it free on my documents?",
    // Prices are still placeholders in pricing.md, so ask about packages instead.
    "What packages do you offer?",
  ],
  // Rotating input placeholders (real questions the knowledge base answers).
  placeholders: [
    "Ask anything about your business…",
    "e.g. Can you integrate with HubSpot?",
    "e.g. How long does setup take?",
    "e.g. Is my data used to train AI models?",
  ],
  thinking: {
    searching: "Searching {n} passages…",
    searchingUnknown: "Searching the knowledge base…",
    found: "Found {k} matches in {docs}",
    writing: "Writing answer…",
  },
  sourcesLabel: "Sources:",
  groundedIn: "Grounded in {k} source{s} · {seconds}s",
  repliedIn: "Replied in {language}",
  feedbackThanks: "Thanks for the feedback",
  handoffTitle: "This isn't in my knowledge base yet.",
  handoffBody: "I can connect you with the Jaseir team — they'll answer directly.",
  handoffLabel: "Talk to the Jaseir team",
  limitTitle: "You've reached the demo limit.",
  errorTitle: "I can't answer right now.",
  clearLabel: "Clear chat",
  expandLabel: "Full screen",
  collapseLabel: "Exit full screen",
  disclaimer: "Demo — answers only from Jaseir's own knowledge base.",
  // Shown under the disclaimer (the fallback AI runs on Google's free tier).
  disclaimerFallback: "If our main AI provider is busy, a reply may come from Google Gemini.",
  // Messages from the live API (/api/rag/chat).
  replies: {
    noAnswer: "I don't have that in my knowledge base yet. Want me to connect you with the Jaseir team?",
    error: "I can't answer right now. Want me to connect you with the Jaseir team?",
    rateLimitedDay: "You've reached today's demo limit. Book a call and we'll show you the assistant working on your own content.",
    rateLimitedHour: "You've asked a lot of questions this hour. Take a short break — or book a call and we'll walk you through it.",
    bookLabel: "Book a call",
    whatsappLabel: "WhatsApp us",
  },
};

/* WHAT IS RAG? (section after the hero + FAQ entry) -------------- */

export const ragWhatIs = {
  label: "WHAT IS RAG?",
  title: "Retrieval-Augmented Generation,",
  titleHighlight: "in three steps.",
  text: "RAG is how the assistant stays accurate: it answers from your documents, not from the internet or guesswork.",
  steps: [
    { icon: "search", name: "Retrieve", text: "Finds the most relevant passages in your documents." },
    { icon: "database", name: "Augment", text: "Gives those passages to the AI as its only source of truth." },
    { icon: "sparkle", name: "Generate", text: "Writes a clear answer and shows exactly where it came from." },
  ],
};

/* 2. PROBLEM ------------------------------------------------------ */

export const ragProblem = {
  label: "THE OLD WAY",
  title: "Answers are stuck in",
  titleHighlight: "files and inboxes.",
  cards: [
    {
      icon: "clock",
      title: "Customers wait for answers",
      text: "The same questions arrive all day on your website, WhatsApp and email — and customers wait until someone is free to reply.",
    },
    {
      icon: "search",
      title: "Your team wastes time searching",
      text: "The answer is somewhere in PDFs, Google Drive, spreadsheets or one person's head. Every lookup pulls someone away from real work.",
    },
    {
      icon: "alert",
      title: "Generic chatbots make things up",
      text: "Bots that aren't grounded in your content guess. One confident wrong answer and customers stop trusting the chat.",
    },
  ],
};

/* 3. HOW IT WORKS ------------------------------------------------- */

export const ragSteps = {
  label: "HOW IT WORKS",
  title: "From your files to",
  titleHighlight: "trusted answers.",
  steps: [
    {
      number: "01",
      name: "Connect",
      text: "Upload documents, website pages, FAQs, catalogs or a Google Drive folder.",
    },
    {
      number: "02",
      name: "Understand",
      text: "Your content is organized, split into passages and indexed.",
    },
    {
      number: "03",
      name: "Retrieve",
      text: "For every question, the most relevant information is found in seconds.",
    },
    {
      number: "04",
      name: "Answer",
      text: "It replies in plain language with the source — or escalates to a human.",
    },
  ],
};

/* 4. WHERE IT WORKS ----------------------------------------------- */

export const ragChannels = {
  label: "WHERE IT WORKS",
  title: "One brain.",
  titleHighlight: "Every channel.",
  global: {
    title: "Ready for customers everywhere.",
    text: "Replies in the language your customer writes in — around the clock, in every time zone.",
    zones: ["New York", "London", "Dubai", "Singapore", "Sydney"],
    zoneLabel: "Online",
  },
  phones: [
    {
      id: "web",
      name: "Website chat",
      lang: "en",
      langLabel: "EN",
      header: "Chat with us",
      question: "Do you have weekend slots?",
      answer: "Yes — Saturdays 10am to 4pm. Want me to book one?",
      source: "Your opening hours",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      lang: "es",
      langLabel: "ES",
      header: "Your Business",
      question: "Hola, ¿hacen entregas los domingos?",
      answer: "¡Sí! Entregamos los domingos en toda la ciudad. ¿Quieres que programe una entrega?",
      source: "Tu política de envíos",
    },
    {
      id: "instagram",
      name: "Instagram DMs",
      lang: "fr",
      langLabel: "FR",
      header: "yourbrand",
      question: "Bonjour, cet article est-il disponible en taille M ?",
      answer: "Oui, la taille M est en stock. Livraison en 3 à 5 jours.",
      source: "Votre catalogue",
    },
  ],
  internal: {
    name: "Internal team assistant",
    text: "Your staff ask the same assistant about SOPs, policies and process docs — and get the answer with the page it came from.",
    example: "What's our refund process for online orders?",
  },
};

/* 5. RAG + AGENTS ------------------------------------------------- */

export const ragAgents = {
  label: "RAG + AGENTS = ACTION",
  title: "Answers that",
  titleHighlight: "move work forward.",
  text: "Connect the knowledge assistant to Jaseir's AI Lead Qualification agent. The customer gets an answer, and your team gets a qualified lead — automatically.",
  flow: [
    { title: "Customer asks", detail: "\"Do you have 3-bedroom options?\"" },
    { title: "RAG answers", detail: "With a source from your docs" },
    { title: "Lead scored", detail: "Intent + fit checked" },
    { title: "CRM updated", detail: "Contact + conversation saved" },
    { title: "WhatsApp alert", detail: "Sales team notified" },
  ],
  cta: { label: "See the Lead Qualification agent", href: ragLinks.leadQualification },
};

/* 6. INDUSTRIES --------------------------------------------------- */

export const ragIndustries = {
  label: "INDUSTRIES",
  title: "Built for teams that",
  titleHighlight: "answer the same questions daily.",
  text: "Every industry has its own documents, rules and questions. We set up the assistant around yours — and it answers the way your best team member would.",
  cta: "Get a demo for",
  // Each card: what it answers and a sample Q&A. `docs[match]` is the
  // source shown under the sample answer; `accent` tints the card.
  items: [
    {
      id: "saas",
      icon: "chat",
      name: "SaaS & support teams",
      accent: "#22d3ee",
      description: "Deflect repetitive tickets with answers from your help center, docs and changelog.",
      answers: ["Product how-tos & troubleshooting", "Plans, billing & account questions", "Hand-off to your support team"],
      question: "How do I connect my Google Calendar?",
      answer: "Go to Settings → Integrations → Google Calendar and click Connect. Syncing takes about a minute.",
      docs: ["Your help center"],
      match: 0,
    },
    {
      id: "ecommerce",
      icon: "cart",
      name: "Ecommerce",
      accent: "#fb923c",
      description: "Resolve product, shipping and return questions instantly and turn browsers into buyers.",
      answers: ["Product details & stock", "Shipping times & order status", "Returns, exchanges & refunds"],
      question: "Can I return an item after 10 days?",
      answer: "Returns are accepted within 30 days of delivery, as long as the item is unused. I can start a return for you.",
      docs: ["Your return policy"],
      match: 0,
    },
    {
      id: "clinics",
      icon: "health",
      name: "Clinics",
      accent: "#f472b6",
      description: "Give patients instant, accurate answers on treatments, timings, preparation and insurance.",
      answers: ["Test preparation & aftercare", "Doctor timings & appointments", "Insurance & payment questions"],
      question: "Do I need to fast before a blood sugar test?",
      answer: "Yes — the patient guide asks for 8 to 10 hours of fasting. Water is fine. Want me to book a morning slot?",
      docs: ["Your patient guide"],
      match: 0,
    },
    {
      id: "real-estate",
      icon: "building",
      name: "Real estate",
      accent: "#fbbf24",
      description: "Answer buyer questions on listings, pricing, approvals and viewings — day and night.",
      answers: ["Listing details & availability", "Pricing, fees & floor plans", "Viewing bookings"],
      question: "Is the project approved, and when is the handover date?",
      answer: "Yes — all approvals are in place. Handover is planned for Q4, as listed in the project brochure.",
      docs: ["Your project brochure"],
      match: 0,
    },
    {
      id: "law-accounting",
      icon: "file",
      name: "Law & accounting firms",
      accent: "#60a5fa",
      description: "Answer client questions on documents, deadlines, services and fees without tying up your partners.",
      answers: ["Document checklists", "Filing deadlines & reminders", "Service scope & fee structure"],
      question: "Which documents do you need for my annual tax filing?",
      answer: "From the firm's checklist: photo ID, income statements, bank statements and receipts for deductions.",
      docs: ["Your client checklist"],
      match: 0,
    },
    {
      id: "agencies",
      icon: "target",
      name: "Agencies",
      accent: "#a78bfa",
      description: "Let prospects and clients self-serve answers on services, process, timelines and pricing.",
      answers: ["Services & deliverables", "Project process & timelines", "Onboarding & client FAQs"],
      question: "How long does a website redesign usually take?",
      answer: "Most redesigns take 6–8 weeks: discovery, design, build and launch. The full timeline is in our process guide.",
      docs: ["Your process guide"],
      match: 0,
    },
  ],
};

/* 7. PACKAGES ----------------------------------------------------- */

export const ragPackages = {
  label: "PACKAGES",
  title: "Start small.",
  titleHighlight: "Grow into agents.",
  note: "Final quote depends on content volume and integrations.",
  items: [
    {
      name: "Starter",
      prefix: "from",
      price: "$499",
      period: "setup + $99/mo",
      description: "A website chatbot that answers from your content.",
      features: [
        "Website chat widget",
        "Up to 50 documents",
        "Answers with sources",
        "Human handoff to your team",
        "Launch in 7 days",
      ],
      cta: "Start with Starter",
      featured: false,
    },
    {
      name: "Growth",
      prefix: "from",
      price: "$1,499",
      period: "setup + $299/mo",
      description: "Website + WhatsApp, connected to your CRM.",
      features: [
        "Everything in Starter",
        "WhatsApp assistant",
        "CRM integration",
        "Lead capture from chats",
        "Multilingual replies",
        "WhatsApp fees billed at cost",
      ],
      cta: "Choose Growth",
      featured: true,
    },
    {
      name: "Custom",
      prefix: "from",
      price: "$4,999",
      period: "quoted per project",
      description: "Agentic RAG across your whole business.",
      features: [
        "Agentic RAG workflows",
        "Multiple sources & channels",
        "Custom integrations",
        "Internal team assistant",
        "Dedicated setup support",
      ],
      cta: "Talk to us",
      featured: false,
    },
  ],
  featuredLabel: "Most popular",
};

/* 8. TRUST -------------------------------------------------------- */

export const ragTrust = {
  label: "WHY YOU CAN TRUST IT",
  title: "Grounded answers.",
  titleHighlight: "No guessing.",
  points: [
    "Answers only from your approved content",
    "Shows sources with every answer",
    "Says \"I don't know\" and hands off to a human",
    "Your data is never used to train public AI models",
  ],
  compliance: ["GDPR-ready", "EU or US data hosting", "Delete your data anytime"],
  example: {
    question: "Can I cancel my booking and get a refund?",
    answer:
      "Yes. Bookings cancelled at least 48 hours before check-in get a full refund. Cancellations within 48 hours are charged one night.",
    source: "Your cancellation policy",
    section: "Section 4 · Cancellations",
    before: "4.1 Guests may cancel through the website or front desk. ",
    highlight: "Bookings cancelled at least 48 hours before check-in receive a full refund.",
    after: " Later cancellations are charged one night's stay.",
    caption: "Example answer — every reply links to the exact line it came from.",
  },
};

/* 9. FAQ ---------------------------------------------------------- */

export const ragFaq = {
  label: "FAQ",
  title: "Questions,",
  titleHighlight: "answered.",
  items: [
    {
      question: "What is RAG and how does it work?",
      answer: `RAG stands for Retrieval-Augmented Generation and works in three steps. ${ragWhatIs.steps
        .map((step) => `${step.name}: ${step.text}`)
        .join(" ")}`,
    },
    {
      question: "What is RAG, in simple words?",
      answer:
        "RAG stands for Retrieval-Augmented Generation. Before the AI answers, it first looks up the most relevant parts of your own documents, and then writes the answer using only that information. It's like giving the AI an open-book exam with your business's book.",
    },
    {
      question: "How is this different from ChatGPT?",
      answer:
        "ChatGPT answers from general internet knowledge and can guess when it isn't sure. A RAG assistant answers from your approved content only, shows the source for every answer, and hands the conversation to your team when the answer isn't in your content.",
    },
    {
      question: "What happens if the AI doesn't know the answer?",
      answer:
        "It says so honestly and offers to connect the customer with your team — on WhatsApp, email or your CRM. It won't make up an answer.",
    },
    {
      question: "Does it work on WhatsApp and in other languages?",
      answer:
        "Yes. The same assistant can run on your website, WhatsApp and Instagram DMs, and it replies in the language your customer writes in.",
    },
    {
      question: "How long does setup take and what does it cost?",
      answer:
        "The Starter package launches in about 7 days after we receive your content. Pricing depends on the package, the amount of content and the integrations you need. Send us 5 documents and your 10 most common questions for a free demo before you decide.",
    },
    {
      question: "Is my business data safe?",
      answer:
        "Your content is used only to answer questions for your business and is never used to train public AI models. The assistant only answers from content you approve.",
    },
  ],
};

/* 10. FINAL CTA --------------------------------------------------- */

export const ragFinalCta = {
  label: "FREE DEMO",
  title: "Try it on your own content.",
  text: "Send us 5 documents and your 10 most common customer questions. See your AI assistant working before you pay anything.",
  primary: { label: "Get my free RAG demo", href: ragLinks.contact },
  whatsapp: { label: "Chat on WhatsApp", href: whatsappUrl },
};

/* HOME PAGE SECTION ----------------------------------------------- */

export const ragHomeSection = {
  label: "RAG ASSISTANT",
  title: "AI that answers from",
  titleHighlight: "your business knowledge.",
  text: "Turn your documents, website and FAQs into an assistant that answers customers 24/7 — with the source for every answer.",
  steps: ["Connect", "Understand", "Retrieve", "Answer"],
  chat: {
    question: "Does it work on WhatsApp?",
    answer: "Yes — the same assistant works on your website, WhatsApp and Instagram DMs, 24/7.",
    source: "FAQ",
  },
  cta: { label: "Explore RAG AI", href: ragLinks.page },
};
