import { ragHomeSection } from "@/app/data/rag-page";
import RagIcon from "./RagIcon";
import "./rag-home.css";

/* Compact RAG AI teaser for the home page → /rag-knowledge-assistant/ */
export default function RagHomeSection() {
  const { label, title, titleHighlight, text, steps, chat, cta } = ragHomeSection;

  return (
    <section className="rag-home" id="rag-ai" aria-labelledby="rag-home-title">
      <div className="rag-home-glow" aria-hidden="true" />

      <div className="agentlab-workspace-container rag-home-inner">
        <div className="rag-home-copy">
          <div className="agentlab-section-heading rag-home-heading">
            <div className="agentlab-section-eyebrow">
              <span />
              {label}
            </div>

            <h2 id="rag-home-title">
              {title}
              <br />
              <span>{titleHighlight}</span>
            </h2>

            <p>{text}</p>
          </div>

          <div className="agentlab-agent-steps rag-home-steps">
            {steps.map((step, index) => (
              <div className="agentlab-step" key={step}>
                <span className="agentlab-step-number">0{index + 1}</span>
                <span className="agentlab-step-name">{step}</span>
                <span className="agentlab-step-check">✓</span>
              </div>
            ))}
          </div>

          <a href={cta.href} className="agentlab-explore-button rag-home-cta">
            {cta.label}
            <span>→</span>
          </a>
        </div>

        <div className="rag-home-chat" aria-hidden="true">
          <div className="rag-home-chat-top">
            <span className="rag-home-avatar">
              <RagIcon name="sparkle" size={15} />
            </span>
            <strong>Knowledge Assistant</strong>
            <em>
              <i /> LIVE
            </em>
          </div>

          <div className="rag-home-chat-body">
            <div className="rag-home-q">{chat.question}</div>

            <div className="rag-home-retrieval">
              <span className="rag-home-orb" />
              Searching your documents…
            </div>

            <div className="rag-home-a">
              {chat.answer}
              <span className="rag-home-source">
                <RagIcon name="check" size={11} />
                {chat.source}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
