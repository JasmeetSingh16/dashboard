import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { PRIVACY_EMAIL } from "../data/site-config";
import "../rag-knowledge-assistant/rag.css";

/* ------------------------------------------------------------------ */
/* /privacy/ — what the lead form and the RAG chat collect             */
/* ------------------------------------------------------------------ */

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-rag-head", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-rag-body", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-rag-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What the Jaseir demo request form and RAG chat assistant collect, why, how long it is kept, and how to ask for deletion.",
};

const UPDATED = "26 September 2026";

export default function PrivacyPage() {
  const mail = <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;

  return (
    <div className={`site rag-site ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <main className="rag-page privacy">
        <div className="rag-container privacy-inner">
          <p className="privacy-kicker">Last updated {UPDATED}</p>
          <h1>Privacy policy</h1>
          <p className="privacy-lead">
            This page explains what we collect through the demo request form and the AI chat assistant on this
            website, why we collect it, how long we keep it, and how you can ask us to delete it. We keep it short and
            only collect what we need.
          </p>

          <section>
            <h2>1. The demo request form</h2>
            <p>When you ask for a demo (&ldquo;Get one for your business&rdquo;), we store:</p>
            <ul>
              <li>your name, work email and company name;</li>
              <li>your website, WhatsApp/phone number and message, if you give them;</li>
              <li>the industry you chose, the page you sent the form from, and when you agreed to be contacted.</li>
            </ul>
            <p>
              <strong>Why:</strong> only to reply to your request and set up your demo. We don&rsquo;t sell your data,
              and we don&rsquo;t add you to a newsletter.
            </p>
          </section>

          <section>
            <h2>2. The AI chat assistant</h2>
            <p>When you use the chat, we store:</p>
            <ul>
              <li>the questions you type and the answers the assistant gives, with the documents it used;</li>
              <li>your 👍/👎 feedback on answers, if you give it;</li>
              <li>
                an anonymous visitor ID made from a one-way hash of your IP address. We do not store your IP address
                itself.
              </li>
            </ul>
            <p>
              <strong>Why:</strong> to answer you, to limit misuse (a small number of questions per visitor), and to
              improve the answers. Please don&rsquo;t type personal or sensitive information into the chat.
            </p>
            <p>
              Your question is sent to the AI providers that power the assistant (Cloudflare Workers AI for search,
              Groq, and Google Gemini as a backup) only to generate the answer.
            </p>
          </section>

          <section>
            <h2>3. Where it is stored</h2>
            <p>
              Form and chat data are stored in our database hosted by Supabase. Rate-limit counters and cached answers
              are stored with Upstash. If email alerts are turned on, a copy of each demo request is emailed to our
              team through Resend. We don&rsquo;t use advertising or tracking cookies for the form or the chat.
            </p>
          </section>

          <section>
            <h2>4. How long we keep it</h2>
            <ul>
              <li>
                <strong>Demo requests:</strong> up to 24 months after our last contact with you, or until you ask us to
                delete them.
              </li>
              <li>
                <strong>Chat questions, answers and feedback:</strong> up to 12 months.
              </li>
              <li>
                <strong>Rate-limit counters:</strong> deleted automatically after 1 hour (hourly limit) or 24 hours
                (daily limit).
              </li>
              <li>
                <strong>Cached answers</strong> to common questions: 24 hours. They contain no personal data.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Your rights and deletion</h2>
            <p>
              You can ask us to see, correct or delete the data we hold about you at any time. Email {mail} with the
              email address you used in the form (for chat data, tell us roughly when you used it). We&rsquo;ll reply
              within 30 days.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>Questions about this policy: {mail}.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
