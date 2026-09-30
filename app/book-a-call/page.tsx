import type { Metadata } from "next";
import { CalendarCheck, MessageCircle, Sparkles } from "lucide-react";
import { agentVars, getAgent } from "../../lib/agents";
import { AI_ORIGIN } from "../../lib/site";
import { WHATSAPP_URL } from "../data/site-config";
import { bookCallCopy } from "../lib/book-call";
import BookCallForm from "./BookCallForm";
import "./book-a-call.css";

/* ------------------------------------------------------------------ */
/* /book-a-call/ — where every "Get Started" / "Book a free call"      */
/* button goes until a calendar booking link is set in lib/site.ts.    */
/* ------------------------------------------------------------------ */

const title = "Book a Free AI Consultation";
const description =
  "Tell us what you'd like to automate and we'll set up a free 30-minute call about AI agents for your business.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${AI_ORIGIN}/book-a-call/` },
  openGraph: { type: "website", url: `${AI_ORIGIN}/book-a-call/`, siteName: "Jaseir", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const steps = [
  { icon: Sparkles, title: "Tell us the job", text: "What you want off your team's plate — enquiries, leads, bookings, reports." },
  { icon: CalendarCheck, title: "We fix a time", text: "We email you within one business day to set up a 30-minute call." },
  { icon: MessageCircle, title: "You get a plan", text: "Which agent fits, what data it needs, and what it would cost — free." },
];

export default function BookACallPage() {
  return (
    <main className="jk-agent bac-page" style={agentVars(getAgent("booking-agent"))}>
      <div className="jk-container bac-grid">
        <div className="bac-copy">
          <p className="jk-eyebrow">{bookCallCopy.eyebrow}</p>
          <h1 className="jk-display bac-title">{bookCallCopy.title}</h1>
          <p className="jk-lede">{bookCallCopy.intro}</p>

          <ol className="bac-steps">
            {steps.map(({ icon: Icon, title: stepTitle, text }) => (
              <li key={stepTitle}>
                <span className="bac-step-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="bac-step-title">{stepTitle}</p>
                  <p className="bac-step-text">{text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="bac-whatsapp">
            Prefer WhatsApp?{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              {bookCallCopy.whatsapp}
            </a>
          </p>
        </div>

        <BookCallForm whatsappUrl={WHATSAPP_URL} />
      </div>
    </main>
  );
}
