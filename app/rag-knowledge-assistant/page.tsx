import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import SiteHeader from "../components/SiteHeader";
import RagChatPanel from "../components/rag/RagChatPanel";
import RagIcon from "../components/rag/RagIcon";
import RagIndustryCards from "../components/rag/RagIndustryCards";
import RagParticleWave from "../components/rag/RagParticleWave";
import RagPipeline from "../components/rag/RagPipeline";
import RagReveal from "../components/rag/RagReveal";
import RagSnapDots from "../components/rag/RagSnapDots";
import {
  ragAgents,
  ragChannels,
  ragFaq,
  ragFinalCta,
  ragHero,
  ragIndustries,
  ragLinks,
  ragPackages,
  ragProblem,
  ragSeo,
  ragSteps,
  ragTrust,
  
} from "../data/rag-page";
import "./rag.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-rag-head", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-rag-body", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-rag-mono", display: "swap" });

export const metadata: Metadata = {
  title: ragSeo.title,
  description: ragSeo.description,
  alternates: { canonical: ragLinks.canonical },
  openGraph: {
    type: "website",
    url: ragLinks.canonical,
    siteName: "Jaseir",
    title: ragSeo.title,
    description: ragSeo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: ragSeo.title,
    description: ragSeo.description,
  },
};

// Two standalone JSON-LD documents (each with its own @context), which is
// the format Google's Rich Results Test expects. FAQ text mirrors the
// visible FAQ exactly.
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${ragLinks.canonical}#service`,
  name: ragSeo.serviceName,
  serviceType: ragSeo.serviceType,
  alternateName: ["RAG chatbot", "RAG AI assistant", "Retrieval-augmented generation chatbot"],
  description: ragSeo.description,
  url: ragLinks.canonical,
  provider: {
    "@type": "Organization",
    name: "Jaseir",
    url: "https://www.jaseir.com/",
  },
  areaServed: "Worldwide",
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: ragLinks.contact,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "RAG knowledge assistant packages",
    itemListElement: ragPackages.items.map((item) => ({
      "@type": "Offer",
      url: ragLinks.contact,
      itemOffered: {
        "@type": "Service",
        name: `${ragSeo.serviceName} — ${item.name}`,
        description: `${item.description} ${item.features.join(", ")}.`,
      },
    })),
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ragFaq.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const toJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

const flowIcons = ["chat", "sparkle", "target", "database", "whatsapp"];

function SectionHeading({
  id,
  label,
  title,
  highlight,
  text,
  center = false,
  accent = false,
}: {
  id: string;
  label: string;
  title: string;
  highlight: string;
  text?: string;
  center?: boolean;
  /** Gradient on the highlight. Used on at most 2 headings (plus the hero). */
  accent?: boolean;
}) {
  return (
    <div className={`rag-heading ${center ? "rag-heading-center" : ""}`} data-reveal>
      <div className="rag-label">
        <span />
        {label}
      </div>
      <h2 id={id}>
        {title} <em className={accent ? "rag-accent" : undefined}>{highlight}</em>
      </h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export default function RagKnowledgeAssistantPage() {
  return (
    <div className={`site rag-site ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />

      <SiteHeader active="rag" theme="dark" />

      <main className="rag-page rag-motion">
        <RagReveal />

        {/* ============================================================ */}
        {/* 1. HERO + LIVE DEMO                                           */}
        {/* ============================================================ */}
        <section className="rag-hero" aria-labelledby="rag-hero-title">
          <div className="rag-hero-glow" aria-hidden="true" />

          <div className="rag-container rag-hero-grid">
            <div className="rag-hero-copy">
              <div className="rag-badge">
                <RagIcon name="sparkle" size={14} />
                {ragHero.badge}
              </div>

              <h1 id="rag-hero-title" className="rag-hero-title">
                <span className="rag-glow-word">{ragHero.titleHighlight}</span> {ragHero.titleAfter}
              </h1>

              <p className="rag-hero-sub">{ragHero.subtitle}</p>

              <ul className="rag-features">
                {ragHero.features.map((feature) => (
                  <li key={feature.title} className="rag-feature">
                    <span className="rag-feature-icon">
                      <RagIcon name={feature.icon} size={20} />
                    </span>
                    <span>
                      <strong>{feature.title}</strong>
                      <small>{feature.text}</small>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="rag-hero-actions">
                <a className="primary-button rag-btn-primary" href={ragHero.primaryCta.href}>
                  {ragHero.primaryCta.label}
                  <span>→</span>
                </a>
                <a className="rag-text-link" href={ragHero.secondaryCta.href}>
                  {ragHero.secondaryCta.label}
                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <ul className="rag-trust-row">
                {ragHero.trust.map((item) => (
                  <li key={item.label}>
                    <span>
                      <RagIcon name={item.icon} size={18} />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <RagChatPanel />
          </div>
        </section>

        

        {/* ============================================================ */}
        {/* 2. PROBLEM                                                    */}
        {/* ============================================================ */}
        <section className="rag-section rag-tight-bottom" aria-labelledby="rag-problem-title">
          <div className="rag-container">
            <SectionHeading
              id="rag-problem-title"
              label={ragProblem.label}
              title={ragProblem.title}
              highlight={ragProblem.titleHighlight}
            />

            <div className="rag-grid-3">
              {ragProblem.cards.map((card, index) => (
                <article
                  className="rag-card rag-card-old"
                  key={card.title}
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <span className="rag-icon-box rag-icon-danger">
                    <RagIcon name={card.icon} size={22} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. HOW IT WORKS                                               */}
        {/* ============================================================ */}
        <section className="rag-section rag-section-alt rag-tight-top" id="rag-how" aria-labelledby="rag-how-title">
          <div className="rag-container">
            <SectionHeading
              id="rag-how-title"
              label={ragSteps.label}
              title={ragSteps.title}
              highlight={ragSteps.titleHighlight}
              accent
            />
            <RagPipeline />
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. WHERE IT WORKS                                             */}
        {/* ============================================================ */}
        <section className="rag-section" aria-labelledby="rag-channels-title">
          <div className="rag-container">
            <SectionHeading
              id="rag-channels-title"
              label={ragChannels.label}
              title={ragChannels.title}
              highlight={ragChannels.titleHighlight}
            />

            <div className="rag-phones" id="rag-phones">
              {ragChannels.phones.map((phone, index) => (
                <figure
                  className={`rag-phone-wrap rag-phone-${phone.id}`}
                  key={phone.id}
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <div className="rag-phone" aria-hidden="true">
                    <div className="rag-phone-screen">
                      <div className="rag-phone-head">
                        <span className="rag-phone-avatar" />
                        <strong>{phone.header}</strong>
                        <em className="rag-phone-lang">{phone.langLabel}</em>
                      </div>
                      <div className="rag-phone-body" lang={phone.lang}>
                        <span className="rag-pbubble rag-pbubble-out">{phone.question}</span>
                        <span className="rag-ptyping">
                          <i />
                          <i />
                          <i />
                        </span>
                        <span className="rag-pbubble rag-pbubble-in">
                          {phone.answer}
                          <small>
                            <RagIcon name="check" size={10} /> {phone.source}
                          </small>
                        </span>
                      </div>
                      <div className="rag-phone-input" />
                    </div>
                  </div>
                  <figcaption>
                    <RagIcon name={phone.id === "web" ? "website" : phone.id} size={18} />
                    <h3>{phone.name}</h3>
                  </figcaption>
                </figure>
              ))}
            </div>

            <RagSnapDots targetId="rag-phones" count={ragChannels.phones.length} label="Channels" />

            <div className="rag-channel-extra">
              <article className="rag-card rag-glass rag-hover" data-reveal>
                <span className="rag-icon-box">
                  <RagIcon name="users" size={22} />
                </span>
                <h3>{ragChannels.internal.name}</h3>
                <p>{ragChannels.internal.text}</p>
                <span className="rag-example-pill">&ldquo;{ragChannels.internal.example}&rdquo;</span>
              </article>

              <div className="rag-lang-card" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
                <p>{ragChannels.global.title}</p>
                <span>{ragChannels.global.text}</span>
                <ul aria-label="Always online in every time zone">
                  {ragChannels.global.zones.map((zone, index) => (
                    <li key={zone} style={{ "--z": index } as React.CSSProperties}>
                      <i />
                      {zone}
                      <small>{ragChannels.global.zoneLabel}</small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. RAG + AGENTS = ACTION                                      */}
        {/* ============================================================ */}
        <section className="rag-section rag-section-alt" aria-labelledby="rag-agents-title">
          <div className="rag-container">
            <div className="rag-split-heading">
              <SectionHeading
                id="rag-agents-title"
                label={ragAgents.label}
                title={ragAgents.title}
                highlight={ragAgents.titleHighlight}
                accent
                text={ragAgents.text}
              />
              <a className="secondary-button rag-btn-ghost" href={ragAgents.cta.href} data-reveal>
                {ragAgents.cta.label}
                <span>↗</span>
              </a>
            </div>

            <ol className="rag-flow" data-reveal>
              {ragAgents.flow.map((step, index) => (
                <li className="rag-flow-node" key={step.title} style={{ "--i": index } as React.CSSProperties}>
                  <span className="rag-flow-icon">
                    <RagIcon name={flowIcons[index]} size={20} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  <span className="rag-flow-check" aria-hidden="true">
                    ✓
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. INDUSTRIES                                                 */}
        {/* ============================================================ */}
        <section className="rag-section rag-tight-bottom" aria-labelledby="rag-industries-title">
          <div className="rag-container">
            <SectionHeading
              id="rag-industries-title"
              label={ragIndustries.label}
              title={ragIndustries.title}
              highlight={ragIndustries.titleHighlight}
              text={ragIndustries.text}
            />
            <div data-reveal>
              <RagIndustryCards />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. PACKAGES                                                   */}
        {/* ============================================================ */}
        <section className="rag-section rag-section-alt rag-tight-top" id="rag-packages" aria-labelledby="rag-packages-title">
          <div className="rag-container">
            <SectionHeading
              id="rag-packages-title"
              label={ragPackages.label}
              title={ragPackages.title}
              highlight={ragPackages.titleHighlight}
              center
            />

            <div className="rag-pricing">
              {ragPackages.items.map((item, index) => (
                <article
                  key={item.name}
                  className={`rag-price-card ${item.featured ? "is-featured" : ""}`}
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  {item.featured && <span className="rag-price-badge">{ragPackages.featuredLabel}</span>}
                  <h3>{item.name}</h3>
                  <p className="rag-price-desc">{item.description}</p>
                  <p className="rag-price">
                    {item.prefix && <small>{item.prefix}</small>}
                    <strong className={item.period ? undefined : "is-text"}>{item.price}</strong>
                    {item.period && <span>/ {item.period}</span>}
                  </p>
                  <ul>
                    {item.features.map((feature) => (
                      <li key={feature}>
                        <RagIcon name="check" size={15} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    className={`primary-button ${item.featured ? "rag-btn-primary" : "rag-btn-ghost"}`}
                    href={ragLinks.contact}
                  >
                    {item.cta}
                    <span>→</span>
                  </a>
                </article>
              ))}
            </div>

            <p className="rag-note">{ragPackages.note}</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. WHY YOU CAN TRUST IT                                       */}
        {/* ============================================================ */}
        <section className="rag-section" aria-labelledby="rag-trust-title">
          <div className="rag-container rag-trust">
            <div>
              <SectionHeading
                id="rag-trust-title"
                label={ragTrust.label}
                title={ragTrust.title}
                highlight={ragTrust.titleHighlight}
              />
              <ul className="rag-checklist">
                {ragTrust.points.map((point, index) => (
                  <li key={point} data-reveal style={{ "--i": index } as React.CSSProperties}>
                    <span>
                      <RagIcon name="check" size={15} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="rag-compliance" data-reveal>
                <RagIcon name="policy" size={16} />
                {ragTrust.compliance.map((item, index) => (
                  <span key={item}>
                    {index > 0 && <i aria-hidden="true">·</i>}
                    {item}
                  </span>
                ))}
              </p>
            </div>

            <figure className="rag-answer-card" data-reveal>
              <div className="rag-answer-q">{ragTrust.example.question}</div>
              <div className="rag-answer-a">
                <span className="rag-chat-avatar">
                  <RagIcon name="sparkle" size={15} />
                </span>
                <p>{ragTrust.example.answer}</p>
              </div>

              <div className="rag-source-doc">
                <div className="rag-source-doc-head">
                  <RagIcon name="policy" size={16} />
                  <strong>{ragTrust.example.source}</strong>
                  <span>{ragTrust.example.section}</span>
                  <b>
                    <RagIcon name="check" size={12} /> Source found
                  </b>
                </div>
                <p>
                  {ragTrust.example.before}
                  <mark>{ragTrust.example.highlight}</mark>
                  {ragTrust.example.after}
                </p>
              </div>

              <figcaption>{ragTrust.example.caption}</figcaption>
            </figure>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. FAQ                                                        */}
        {/* ============================================================ */}
        <section className="rag-section rag-section-alt" id="rag-faq" aria-labelledby="rag-faq-title">
          <div className="rag-container rag-faq">
            <SectionHeading id="rag-faq-title" label={ragFaq.label} title={ragFaq.title} highlight={ragFaq.titleHighlight} />

            <div className="rag-faq-list" data-reveal>
              {ragFaq.items.map((item) => (
                <details key={item.question}>
                  <summary>
                    <h3>{item.question}</h3>
                    <span aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 10. FINAL CTA                                                 */}
        {/* ============================================================ */}
        <section className="rag-final" aria-labelledby="rag-final-title">
          <div className="rag-container">
            <div className="rag-final-band" data-reveal>
              <RagParticleWave />
              <div className="rag-final-copy">
                <div className="rag-label">
                  <span />
                  {ragFinalCta.label}
                </div>
                <h2 id="rag-final-title">{ragFinalCta.title}</h2>
                <p>{ragFinalCta.text}</p>
                <div className="rag-buttons">
                  <a className="primary-button rag-btn-primary" href={ragFinalCta.primary.href}>
                    {ragFinalCta.primary.label}
                    <span>→</span>
                  </a>
                  <a
                    className="primary-button rag-btn-whatsapp"
                    href={ragFinalCta.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <RagIcon name="whatsapp" size={20} />
                    {ragFinalCta.whatsapp.label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
