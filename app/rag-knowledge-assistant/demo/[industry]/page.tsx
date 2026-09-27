import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import LeadButton from "../../../components/leads/LeadButton";
import RagDemoExperience from "../../../components/rag/RagDemoExperience";
import RagIcon from "../../../components/rag/RagIcon";
import {
  demoPageCopy,
  demoPageUrl,
  INDUSTRY_DEMO_IDS,
  isIndustryDemoId,
  ragDemoPages,
  ragDemos,
  type IndustryDemoId,
} from "../../../data/rag-demos";
import { ragIndustries } from "../../../data/rag-page";
import "../../rag.css";

/* ------------------------------------------------------------------ */
/* /rag-knowledge-assistant/demo/<industry>/ — one live demo per industry */
/* ------------------------------------------------------------------ */
/*
 * The same RAG chat panel as the main page, locked to one tenant with
 * sample content. Statically generated for the 6 industries; anything
 * else is a 404. Not indexed (noindex) and not in any sitemap yet.
 */

// Same fonts as the main RAG page (next/font de-duplicates the files).
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-rag-head", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-rag-body", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-rag-mono", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRY_DEMO_IDS.map((industry) => ({ industry }));
}

type Params = { params: Promise<{ industry: string }> };

/** "Clinic Assistant" → "Clinic RAG Assistant Demo" */
const seoName = (title: string) => title.replace(/Assistant$/, "RAG Assistant Demo");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { industry } = await params;
  if (!isIndustryDemoId(industry)) return {};
  const demo = ragDemos[industry];
  return {
    title: `${seoName(demo.title)} | Jaseir`,
    description: `Try a live RAG assistant demo for ${ragDemoPages[industry].noun}s, answering from sample documents with sources.`,
    robots: { index: false, follow: true },
  };
}

/** Photo if one exists in /public (WebP preferred), else null → gradient placeholder. */
function findImage(base: string): string | null {
  for (const ext of [".webp", ".jpg", ".jpeg", ".png"]) {
    if (existsSync(path.join(process.cwd(), "public", `${base}${ext}`))) return `${base}${ext}`;
  }
  return null;
}

export default async function IndustryDemoPage({ params }: Params) {
  const { industry } = await params;
  if (!isIndustryDemoId(industry)) notFound();

  const id: IndustryDemoId = industry;
  const demo = ragDemos[id];
  const page = ragDemoPages[id];
  const card = ragIndustries.items.find((item) => item.id === page.industryId);
  if (!card) notFound();

  const image = findImage(page.image.src);

  // The other 5 demos, with their card's icon, name and accent colour.
  const others = INDUSTRY_DEMO_IDS.filter((other) => other !== id).map((other) => {
    const otherCard = ragIndustries.items.find((item) => item.id === ragDemoPages[other].industryId);
    return { id: other, name: otherCard?.name ?? ragDemos[other].title, icon: otherCard?.icon ?? "doc", accent: otherCard?.accent ?? "#22d3ee" };
  });

  return (
    <div className={`site rag-site ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <SiteHeader active="rag" theme="dark" />

      <main
        className="rag-page rdp"
        style={{ "--accent": card.accent, "--chat-accent": page.chatAccent } as React.CSSProperties}
      >
        <div className="rag-container">
          <nav className="rdp-topbar" aria-label="Demo navigation">
            <a className="rdp-back" href="/rag-knowledge-assistant/#industries">
              <span aria-hidden="true">←</span> All industries
            </a>
            <LeadButton className="rdp-get" industry={id}>
              {ragIndustries.demoCta}
              <span aria-hidden="true">›</span>
            </LeadButton>
          </nav>

          <RagDemoExperience
            tenant={id}
            image={{ src: image, alt: page.image.alt }}
            bubbles={demo.bubbles ?? demo.starters.map((starter) => starter.text)}
            header={
              <>
                <div className="rdp-label">
                  <span className="rdp-label-icon">
                    <RagIcon name={card.icon} size={14} />
                  </span>
                  {page.label} DEMO · SAMPLE CONTENT
                </div>
                <h1 className="rdp-title">{demo.title}</h1>
                <p className="rdp-desc">{card.description}</p>
                {page.note && <p className="rdp-note">{page.note}</p>}
              </>
            }
            footer={
              <ul className="rdp-list">
                {card.answers.map((item) => (
                  <li key={item}>
                    <span>
                      <RagIcon name="check" size={13} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            }
          />

          {/* Before / after — no numbers, just the difference */}
          <section className="rdp-ba" aria-label={demoPageCopy.beforeAfter.title}>
            <div className="rdp-ba-head" aria-hidden="true">
              <span>{demoPageCopy.beforeAfter.before}</span>
              <span />
              <span>{demoPageCopy.beforeAfter.after}</span>
            </div>
            {demoPageCopy.beforeAfter.rows.map(([before, after]) => (
              <div className="rdp-ba-row" key={before}>
                <span className="rdp-ba-before">{before}</span>
                <span className="rdp-ba-arrow" aria-hidden="true">
                  <RagIcon name="arrow" size={16} />
                </span>
                <span className="rdp-ba-after">
                  <RagIcon name="check" size={14} />
                  {after}
                </span>
              </div>
            ))}
          </section>

          {/* Other demos */}
          <section className="rdp-others" aria-labelledby="rdp-others-title">
            <h2 id="rdp-others-title">{demoPageCopy.otherTitle}</h2>
            <div className="rdp-others-row">
              {others.map((other) => (
                <a
                  key={other.id}
                  className="rdp-other"
                  href={demoPageUrl(other.id)}
                  style={{ "--accent": other.accent } as React.CSSProperties}
                >
                  <span className="rdp-other-icon">
                    <RagIcon name={other.icon} size={18} />
                  </span>
                  {other.name}
                  <span className="rdp-other-arrow" aria-hidden="true">›</span>
                </a>
              ))}
            </div>
          </section>

          <section className="rdp-cta" aria-labelledby="rdp-cta-title">
            <h2 id="rdp-cta-title">{demoPageCopy.ctaTitle.replace("{noun}", page.noun)}</h2>
            <LeadButton className="primary-button rag-btn-primary" industry={id}>
              {demoPageCopy.ctaButton}
              <span aria-hidden="true">→</span>
            </LeadButton>
          </section>
        </div>
      </main>
    </div>
  );
}
