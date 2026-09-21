"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* CONTENT                                                            */
/* ------------------------------------------------------------------ */

const inputCards = [
  {
    title: "Text",
    subtitle: "Documents, notes…",
    icon: "text",
    tone: "blue",
  },
  {
    title: "Data",
    subtitle: "Tables, metrics…",
    icon: "data",
    tone: "green",
  },
  {
    title: "Images",
    subtitle: "Visual content…",
    icon: "images",
    tone: "pink",
  },
  {
    title: "Web",
    subtitle: "Real-time information…",
    icon: "web",
    tone: "indigo",
  },
  {
    title: "People",
    subtitle: "Ideas, conversations…",
    icon: "people",
    tone: "blue",
  },
];

const outcomes = [
  { label: "Insights", icon: "chart", tone: "blue" },
  { label: "Content", icon: "doc", tone: "purple" },
  { label: "Plans", icon: "bolt", tone: "orange" },
  { label: "Automations", icon: "gear", tone: "violet" },
  { label: "Opportunities", icon: "target", tone: "pink" },
];

/* ------------------------------------------------------------------ */
/* ICONS                                                              */
/* ------------------------------------------------------------------ */

function Icon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "text":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
          <path d="M14 3.5v4h4" />
          <path d="M8.5 13h7M8.5 16.3h5" />
        </svg>
      );

    case "data":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5.5" rx="7" ry="2.7" />
          <path d="M5 5.5v6.4c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V5.5" />
          <path d="M5 11.9v6.4c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-6.4" />
        </svg>
      );

    case "images":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
          <circle cx="9" cy="10" r="1.7" />
          <path d="m4.5 17 4.6-4.6a1.6 1.6 0 0 1 2.2 0l1.9 1.9M14.2 15l1.6-1.6a1.6 1.6 0 0 1 2.2 0l1.5 1.5" />
        </svg>
      );

    case "web":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5Z" />
        </svg>
      );

    case "people":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M4.5 19.5V10M11 19.5V4.5M17.5 19.5V13" />
        </svg>
      );

    case "doc":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
          <path d="M8.5 13h7M8.5 16.3h5" />
        </svg>
      );

    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 3 5 13.5h5.3L11 21l8-10.8h-5.3L13 3Z" />
        </svg>
      );

    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );

    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3.5 13.5 9 19 10.5 13.5 12 12 17.5 10.5 12 5 10.5 10.5 9 12 3.5Z" />
        </svg>
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* MOVING DOT CONFIG                                                   */
/* ------------------------------------------------------------------ */

type ConnPath = {
  id: string;
  color: string;
  duration: number;
  delay: number;
  r?: number;
};

const dotPaths: ConnPath[] = [
  {
    id: "path-text",
    color: "#4f88ff",
    duration: 3800,
    delay: 0,
  },
  {
    id: "path-data",
    color: "#2fbf83",
    duration: 4500,
    delay: 800,
  },
  {
    id: "path-images",
    color: "#ef5fbd",
    duration: 4200,
    delay: 1200,
  },
  {
    id: "path-web",
    color: "#7668ff",
    duration: 4700,
    delay: 500,
  },
  {
    id: "path-people",
    color: "#f3a03b",
    duration: 4900,
    delay: 1500,
  },

  {
    id: "path-k1",
    color: "#5790ff",
    duration: 3600,
    delay: 200,
  },
  {
    id: "path-k2",
    color: "#8274ff",
    duration: 4000,
    delay: 1400,
  },

  {
    id: "path-o1",
    color: "#5790ff",
    duration: 3200,
    delay: 100,
  },
  {
    id: "path-o2",
    color: "#8274ff",
    duration: 3400,
    delay: 700,
  },
  {
    id: "path-o3",
    color: "#ef65c6",
    duration: 3600,
    delay: 1300,
  },
  {
    id: "path-o4",
    color: "#f7a33d",
    duration: 3800,
    delay: 1900,
  },

  {
    id: "path-loop",
    color: "#735dff",
    duration: 7000,
    delay: 0,
    r: 4,
  },
  {
    id: "path-loop",
    color: "#e749c4",
    duration: 7000,
    delay: 3500,
    r: 3.5,
  },
];

/* ------------------------------------------------------------------ */
/* PLATFORM SECTION CONTENT (Jasper-style 3-column feature grid)      */
/* ------------------------------------------------------------------ */

const platformCards = [
  {
    key: "green",
    title: "Agents",
    description:
      "Purpose-built AI agents that understand context and act autonomously across your entire information stack.",
    type: "agent",
  },
  {
    key: "peach",
    title: "Workflows",
    description:
      "Repeatable pipelines that move work from idea to execution — structured, connected, and built to scale.",
    type: "workflow",
  },
  {
    key: "blue",
    title: "Jaseir IQ",
    description:
      "Maintain accuracy and context awareness with a knowledge layer trained on your organization's real information.",
    type: "iq",
  },
];

const jaseirServices = [
  {
    id: "ai",
    number: "01",
    title: "AI Automation & Agents",
    description:
      "Build intelligent agents that qualify leads, analyze information, generate decisions, and take action across the tools your team already uses.",
    icon: "sparkle",
    eyebrow: "AI AGENT",
    backTitle: "AI Agent",
    backText: "Understands context and takes action",
    frontTitle: "Agent Workspace",
    frontLabel: "AUTONOMOUS ACTION",
    frontText:
      "Analyze incoming requests, choose the right tools, and move work forward automatically.",
    items: ["Understand", "Reason", "Act"],
    theme: "violet",
  },
  {
    id: "seo",
    number: "02",
    title: "SEO & AI Search Visibility",
    description:
      "Improve how your business appears across traditional search and AI answer engines with technical SEO, content strategy, entity signals, and visibility analysis.",
    icon: "chart",
    eyebrow: "AI VISIBILITY",
    backTitle: "Search Intelligence",
    backText: "See where your brand is visible",
    frontTitle: "Visibility Monitor",
    frontLabel: "AI SEARCH ANALYSIS",
    frontText:
      "Find ranking gaps, citation opportunities, content opportunities, and signals affecting discoverability.",
    items: ["Search", "Citations", "Opportunities"],
    theme: "coral",
  },
  {
    id: "automation",
    number: "03",
    title: "CRM & Workflow Automation",
    description:
      "Connect your CRM, forms, email, messaging, and business tools into reliable workflows that move prospects and customers through the right journey.",
    icon: "bolt",
    eyebrow: "WORKFLOW ENGINE",
    backTitle: "Workflow Builder",
    backText: "Connect every step of the customer journey",
    frontTitle: "Automation Flow",
    frontLabel: "RUNNING WORKFLOW",
    frontText:
      "Trigger actions, enrich records, send follow-ups, update your CRM, and keep teams in sync.",
    items: ["Trigger", "Automate", "Complete"],
    theme: "gold",
  },
  {
    id: "web",
    number: "04",
    title: "Web Development & Ecommerce",
    description:
      "Create high-performing websites and ecommerce experiences with conversion-focused UX, intelligent analysis, and integrations built around your business goals.",
    icon: "web",
    eyebrow: "WEB INTELLIGENCE",
    backTitle: "Website Intelligence",
    backText: "Understand what visitors experience",
    frontTitle: "Conversion Insights",
    frontLabel: "LIVE ANALYSIS",
    frontText:
      "Identify friction across UX, mobile experience, calls to action, trust, speed, and customer journeys.",
    items: ["Analyze", "Optimize", "Convert"],
    theme: "mint",
  },
];

const trustedLogos = [
  { key: "stripe", node: <span className="trusted-logo-mark stripe-mark">stripe</span>, label: null },
  { key: "openai", node: <span className="trusted-logo-mark openai-mark" />, label: "OpenAI" },
  { key: "notion", node: <span className="trusted-logo-mark notion-mark">N</span>, label: "Notion" },
  { key: "vercel", node: <span className="trusted-logo-mark vercel-mark" />, label: "Vercel" },
  { key: "linear", node: <span className="trusted-logo-mark linear-mark" />, label: "Linear" },
  {
    key: "figma",
    node: (
      <span className="trusted-logo-mark figma-mark">
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    ),
    label: "Figma",
  },
];

/* ------------------------------------------------------------------ */
/* PLATFORM CARD AI VISUALS                                          */
/* ------------------------------------------------------------------ */

function AgentVisual() {
  return (
    <div className="ai-mini-ui agent-ui">
      <div className="ai-status">
        <span className="live-dot" />
        Agent active
      </div>

      <div className="agent-flow">
        <div className="agent-node agent-input">
          <span className="node-icon">
            <Icon name="text" />
          </span>
          <div>
            <strong>New request</strong>
            <small>Analyze campaign data</small>
          </div>
        </div>

        <div className="flow-line"><span /></div>

        <div className="agent-node agent-brain-node">
          <div className="brain-glow">
            <Icon name="sparkle" />
          </div>
          <div>
            <strong>AI Agent</strong>
            <small>Reasoning + planning</small>
          </div>
          <span className="thinking-bars">
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className="flow-line"><span /></div>

        <div className="agent-tools">
          <div className="tool-pill">
            <Icon name="web" />
            Web
          </div>
          <div className="tool-pill">
            <Icon name="data" />
            Data
          </div>
          <div className="tool-pill active-tool">
            <Icon name="bolt" />
            Action
          </div>
        </div>
      </div>

      <div className="agent-result">
        <div className="result-check">✓</div>
        <div>
          <strong>Task completed</strong>
          <small>3 actions executed automatically</small>
        </div>
        <span className="result-arrow">↗</span>
      </div>
    </div>
  );
}

function WorkflowVisual() {
  return (
    <div className="ai-mini-ui workflow-ui">
      <div className="workflow-topbar">
        <span className="workflow-label">
          <span className="live-dot" />
          AI workflow
        </span>
        <span className="workflow-running">Running</span>
      </div>

      <div className="workflow-canvas">
        <div className="workflow-path path-one" />
        <div className="workflow-path path-two" />
        <div className="workflow-path path-three" />

        <div className="workflow-node node-trigger">
          <span className="workflow-node-icon">
            <Icon name="bolt" />
          </span>
          <div>
            <strong>Trigger</strong>
            <small>New lead</small>
          </div>
        </div>

        <div className="workflow-node node-ai">
          <span className="workflow-node-icon">
            <Icon name="sparkle" />
          </span>
          <div>
            <strong>AI Analysis</strong>
            <small>Qualify + enrich</small>
          </div>
        </div>

        <div className="workflow-node node-action">
          <span className="workflow-node-icon">
            <Icon name="gear" />
          </span>
          <div>
            <strong>Action</strong>
            <small>Update CRM</small>
          </div>
        </div>

        <div className="workflow-node node-complete">
          <span className="workflow-check">✓</span>
          <div>
            <strong>Complete</strong>
            <small>Lead routed</small>
          </div>
        </div>

        <span className="workflow-pulse pulse-one" />
        <span className="workflow-pulse pulse-two" />
        <span className="workflow-pulse pulse-three" />
      </div>

      <div className="workflow-footer">
        <span>4 steps</span>
        <span>•</span>
        <span>Autonomous execution</span>
      </div>
    </div>
  );
}

function IQVisual() {
  return (
    <div className="ai-mini-ui iq-ui">
      <div className="iq-search">
        <span className="search-icon">⌕</span>
        <span>What are our Q3 growth opportunities?</span>
        <span className="search-enter">↵</span>
      </div>

      <div className="iq-processing">
        <div className="iq-orb">
          <Icon name="sparkle" />
        </div>
        <div className="iq-processing-copy">
          <strong>Jaseir IQ</strong>
          <div className="iq-progress"><span /></div>
          <small>Searching company knowledge...</small>
        </div>
      </div>

      <div className="iq-sources">
        <div className="source-title">
          <span>Context retrieved</span>
          <b>94%</b>
        </div>

        <div className="source-items">
          <div className="source-item">
            <span className="source-icon"><Icon name="doc" /></span>
            <span>Q3 Strategy.pdf</span>
            <b>Relevant</b>
          </div>
          <div className="source-item">
            <span className="source-icon"><Icon name="data" /></span>
            <span>Revenue Analytics</span>
            <b>Relevant</b>
          </div>
          <div className="source-item">
            <span className="source-icon"><Icon name="people" /></span>
            <span>Team Knowledge</span>
            <b>Relevant</b>
          </div>
        </div>
      </div>

      <div className="iq-answer">
        <span className="answer-sparkle"><Icon name="sparkle" /></span>
        <span>Answer generated from your organization's context</span>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* JASEIR SERVICES SHOWCASE                                           */
/* ------------------------------------------------------------------ */

function JaseirServiceVisual({ service }: { service: (typeof jaseirServices)[number] }) {
  return (
    <div className={`service-showcase service-theme-${service.theme}`}>
      <div className="service-grid-bg" />
      <div className="service-orbit service-orbit-one" />
      <div className="service-orbit service-orbit-two" />

      <div className="service-floating-label">
        <span className="service-live-dot" />
        {service.eyebrow}
      </div>

      <div className="service-back-panel">
        <div className="service-window-top">
          <span className="window-dots"><i /><i /><i /></span>
          <strong>{service.backTitle}</strong>
          <span className="window-status">● ACTIVE</span>
        </div>

        <div className="service-back-content">
          <div className="service-back-heading">
            <span>{service.eyebrow}</span>
            <h4>{service.backTitle}</h4>
            <p>{service.backText}</p>
          </div>

          <div className="service-metric-row">
            <div>
              <span>INTELLIGENCE</span>
              <strong>Connected</strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong>Working</strong>
            </div>
          </div>

          <div className="service-bars">
            <span style={{ width: "82%" }} />
            <span style={{ width: "66%" }} />
            <span style={{ width: "91%" }} />
          </div>
        </div>
      </div>

      <div className="service-front-panel">
        <div className="service-front-top">
          <span className="window-dots"><i /><i /><i /></span>
          <strong>{service.frontTitle}</strong>
          <span className="front-chip">{service.frontLabel}</span>
        </div>

        <div className="service-front-body">
          <div className="service-ai-mark">
            <Icon name={service.icon} />
          </div>

          <h3>{service.frontTitle}</h3>
          <p>{service.frontText}</p>

          <div className="service-process">
            {service.items.map((item, index) => (
              <div className="service-process-item" key={item}>
                <span className="process-number">0{index + 1}</span>
                <span>{item}</span>
                <b>✓</b>
              </div>
            ))}
          </div>
        </div>

        <div className="service-front-footer">
          <span><i /> Jaseir AI</span>
          <span>View intelligence →</span>
        </div>
      </div>

      <div className="service-result-card">
        <div className="service-result-icon">
          <Icon name={service.icon} />
        </div>
        <div>
          <span>JASEIR INSIGHT</span>
          <strong>{service.id === "seo" ? "Visibility opportunity" : service.id === "automation" ? "Workflow completed" : service.id === "web" ? "Friction detected" : "Action ready"}</strong>
        </div>
        <b>↗</b>
      </div>
    </div>
  );
}

function JaseirServicesSection() {
  // The active service changes automatically.
  // No click or hover is required.
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % jaseirServices.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const activeService = jaseirServices[activeIndex];

  return (
    <section
      className="jaseir-services-section"
      id="solutions"
    >
      <div className="jaseir-services-grid" />

      <div className="jaseir-services-inner">
        <div className="jaseir-services-copy">
          <div className="services-eyebrow">
            <span />
            AI-POWERED SERVICES
          </div>

          <h2 className="services-title">
            Intelligence that
            <br />
            <em>works across</em>
            <br />
            your business.
          </h2>

          <p className="services-intro">
            From AI automation and search visibility to web development and CRM workflows — Jaseir connects intelligence with the systems your business already uses.
          </p>

          <div className="services-list">
            {jaseirServices.map((service, index) => {
              const active = index === activeIndex;

              return (
                <div
                  key={service.id}
                  className={`service-row ${active ? "is-active" : ""}`}
                  aria-current={active ? "true" : undefined}
                >
                  <span className="service-number">{service.number}</span>

                  <span className={`service-row-icon service-row-icon-${service.theme}`}>
                    <Icon name={service.icon} />
                  </span>

                  <span className="service-row-content">
                    <strong>{service.title}</strong>
                    {active && <span className="service-row-description">{service.description}</span>}
                  </span>

                  <span className="service-row-arrow">{active ? "↗" : "→"}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="jaseir-services-visual">
          <JaseirServiceVisual service={activeService} />
        </div>
      </div>
    </section>
  );
}



/* ------------------------------------------------------------------ */
/* AI AGENTS — AGENTLAB STYLE SHOWCASE                                */
/* ------------------------------------------------------------------ */
const agentShowcase = [
  {
    name: "AI Lead Qualification",
    label: "LEAD INTELLIGENCE",
    description:
      "Qualify incoming leads, understand intent, enrich records, and route the right opportunities automatically.",
    steps: [
      "Understand lead intent",
      "Score and enrich",
      "Route to the right action",
    ],
    insight: "High-intent lead detected",
    preview: {
      input: "New lead submitted",
      process: "Intent + fit analysis",
      output: "Qualified opportunity",
      metrics: [
        ["Signals", "18"],
        ["Confidence", "94%"],
        ["Actions", "3"],
      ],
      tools: ["CRM", "Email", "Enrichment"],
    },
  },
  {
    name: "AI SEO Planner",
    label: "SEARCH INTELLIGENCE",
    description:
      "Audit technical SEO, content, UX, performance, and AI-search visibility to build a prioritized growth plan.",
    steps: [
      "Audit website signals",
      "Find visibility gaps",
      "Build growth roadmap",
    ],
    insight: "SEO opportunity found",
    preview: {
      input: "Website + search data",
      process: "SEO signal analysis",
      output: "Prioritized roadmap",
      metrics: [
        ["Signals", "42"],
        ["Issues", "11"],
        ["Priorities", "7"],
      ],
      tools: ["Search", "Content", "Analytics"],
    },
  },
  {
    name: "AI Content Planner",
    label: "CONTENT INTELLIGENCE",
    description:
      "Turn business goals, audiences, and search opportunities into an organized content strategy and publishing plan.",
    steps: [
      "Research opportunities",
      "Plan content",
      "Create publishing workflow",
    ],
    insight: "Content opportunity found",
    preview: {
      input: "Goals + audience",
      process: "Topic opportunity analysis",
      output: "Content calendar",
      metrics: [
        ["Topics", "24"],
        ["Clusters", "8"],
        ["Posts", "16"],
      ],
      tools: ["Search", "Strategy", "Calendar"],
    },
  },
  {
    name: "AI Conversion Friction Analyzer",
    label: "CONVERSION INTELLIGENCE",
    description:
      "Identify friction across UX, messaging, CTAs, trust, mobile experience, and the customer journey.",
    steps: [
      "Analyze visitor journey",
      "Detect friction",
      "Prioritize improvements",
    ],
    insight: "Conversion friction detected",
    preview: {
      input: "Page + visitor journey",
      process: "Friction pattern analysis",
      output: "Conversion action plan",
      metrics: [
        ["Signals", "31"],
        ["Friction", "9"],
        ["Actions", "6"],
      ],
      tools: ["UX", "Analytics", "CRO"],
    },
  },
  {
    name: "AI Competitor Comparison",
    label: "COMPETITIVE INTELLIGENCE",
    description:
      "Compare competitors across positioning, content, search visibility, offers, and digital experience.",
    steps: [
      "Collect competitor signals",
      "Compare gaps",
      "Surface opportunities",
    ],
    insight: "Competitive gap found",
    preview: {
      input: "Competitor websites",
      process: "Positioning comparison",
      output: "Opportunity map",
      metrics: [
        ["Signals", "36"],
        ["Gaps", "12"],
        ["Opportunities", "8"],
      ],
      tools: ["Web", "Search", "Content"],
    },
  },
];

function AgentsShowcaseSection() {
  const [activeAgent, setActiveAgent] = useState(0);
  const agent = agentShowcase[activeAgent];

  const agentUrls: Record<string, string> = {
    "AI Lead Qualification": "https://ai.jaseir.com/ai-lead-qualification/",
    "AI SEO Planner": "https://ai.jaseir.com/ai-planner/",
    "AI Content Planner": "https://ai.jaseir.com/ai-content-planner/",
    "AI Conversion Friction Analyzer": "https://ai.jaseir.com/conversion-friction-analyzer/",
    "AI Competitor Comparison": "https://ai.jaseir.com/ai-competitor-comparison/",
  };

  const agentIcons = ["people", "chart", "doc", "target", "web"];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAgent((current) => (current + 1) % agentShowcase.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const openAgent = (name: string) => {
    const url = agentUrls[name];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* ============================================================= */}
      {/* AGENT INTRO / HERO                                            */}
      {/* ============================================================= */}
      <section className="agentlab-intro">
        <div className="agentlab-intro-grid" />
        <div className="agentlab-intro-glow" />

        <div className="agentlab-intro-inner">
          <div className="agentlab-intro-copy">
            <div className="agentlab-eyebrow">
              <span className="agentlab-eyebrow-dot" />
              AI AGENTS FOR BUSINESS
            </div>

            <h2 className="agentlab-intro-title">
              Scale your business
              <br />
              with <span>AI Agents</span>
            </h2>

            <p className="agentlab-intro-description">
              Purpose-built AI agents that understand your business, reason
              through complex work, and take action across the tools your team
              already uses.
            </p>

            <a href="#agent-workspace" className="agentlab-explore-button">
              Explore Our Agents
              <span>→</span>
            </a>

            <div className="agentlab-proof">
              <span><b>✓</b> Understand context</span>
              <span><b>✓</b> Reason through work</span>
              <span><b>✓</b> Take action</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SEPARATE FULL AGENT WORKSPACE                                 */}
      {/* ============================================================= */}
      <section className="agentlab-workspace-section" id="agent-workspace">
        <div className="agentlab-workspace-bg" />
        <div className="agentlab-workspace-glow" />

        <div className="agentlab-workspace-container">
          <div className="agentlab-section-heading">
            <div className="agentlab-section-eyebrow">
              <span />
              AI AGENTS
            </div>

            <h2>
              AI agents built to
              <br />
              <span>do the work.</span>
            </h2>

            <p>
              Explore intelligent agents designed for lead qualification,
              SEO planning, content strategy, conversion analysis, and
              competitive research.
            </p>
          </div>

          {/* THE LARGE BOX */}
          <div className="agentlab-box">
            {/* Box top bar */}
            <div className="agentlab-box-topbar">
              <div className="agentlab-window-dots">
                <i />
                <i />
                <i />
              </div>

              <div className="agentlab-box-title">
                Jaseir Agent Workspace
              </div>

              <div className="agentlab-live">
                <i />
                LIVE
              </div>
            </div>

            {/* Box body */}
            <div className="agentlab-box-body">
              {/* ===================================================== */}
              {/* LEFT: AGENTS INSIDE THE BOX                          */}
              {/* ===================================================== */}
              <aside className="agentlab-agent-nav">
                <div className="agentlab-agent-nav-label">
                  YOUR AGENTS
                </div>

                <div className="agentlab-agent-nav-list">
                  {agentShowcase.map((item, index) => {
                    const active = index === activeAgent;

                    return (
                      <button
                        type="button"
                        key={item.name}
                        className={`agentlab-agent-nav-item ${
                          active ? "active" : ""
                        }`}
                        onClick={() => setActiveAgent(index)}
                      >
                        <span className="agentlab-agent-nav-icon">
                          <Icon name={agentIcons[index]} />
                        </span>

                        <span className="agentlab-agent-nav-name">
                          {item.name.replace("AI ", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* ===================================================== */}
              {/* RIGHT: LARGE ACTIVE AGENT                            */}
              {/* ===================================================== */}
              <div className="agentlab-agent-content" key={agent.name}>
                <div className="agentlab-agent-content-top">
                  <div className="agentlab-agent-category">
                    {agent.label}
                  </div>

                  <div className="agentlab-agent-status">
                    <i />
                    ACTIVE
                  </div>
                </div>

                <div className="agentlab-agent-icon-large">
                  <Icon name={agentIcons[activeAgent]} />
                </div>

                <h3>{agent.name}</h3>

                <p className="agentlab-agent-description">
                  {agent.description}
                </p>

                <div className="agentlab-agent-divider" />

                <div className="agentlab-agent-steps">
                  {agent.steps.map((step, index) => (
                    <div className="agentlab-step" key={step}>
                      <span className="agentlab-step-number">
                        0{index + 1}
                      </span>

                      <span className="agentlab-step-name">
                        {step}
                      </span>

                      <span className="agentlab-step-check">✓</span>
                    </div>
                  ))}
                </div>

                {/* RICH AGENT PREVIEW */}
                <div className="agentlab-preview">
                  <div className="agentlab-preview-head">
                    <div>
                      <span>LIVE AGENT PREVIEW</span>
                      <strong>How this agent moves work forward</strong>
                    </div>
                    <span className="agentlab-preview-live">
                      <i /> Running
                    </span>
                  </div>

                  <div className="agentlab-preview-flow">
                    <div className="agentlab-preview-card">
                      <span className="agentlab-preview-index">INPUT</span>
                      <strong>{agent.preview.input}</strong>
                      <small>Context received</small>
                    </div>

                    <span className="agentlab-preview-arrow">→</span>

                    <div className="agentlab-preview-card active">
                      <span className="agentlab-preview-index">AI PROCESS</span>
                      <strong>{agent.preview.process}</strong>
                      <small>Reasoning in progress</small>
                    </div>

                    <span className="agentlab-preview-arrow">→</span>

                    <div className="agentlab-preview-card">
                      <span className="agentlab-preview-index">OUTPUT</span>
                      <strong>{agent.preview.output}</strong>
                      <small>Ready for action</small>
                    </div>
                  </div>

                  <div className="agentlab-preview-bottom">
                    <div className="agentlab-metrics">
                      {agent.preview.metrics.map(([label, value]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="agentlab-tools">
                      <span>CONNECTED TO</span>
                      <div>
                        {agent.preview.tools.map((tool) => (
                          <b key={tool}>{tool}</b>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="agentlab-open-button"
                  onClick={() => openAgent(agent.name)}
                >
                  Open Agent
                  <span>↗</span>
                </button>
              </div>
            </div>

            {/* Floating insight */}
            <div className="agentlab-insight">
              <div className="agentlab-insight-icon">
                <Icon name="sparkle" />
              </div>

              <div>
                <span>JASEIR AI INSIGHT</span>
                <strong>{agent.insight}</strong>
              </div>

              <b>↗</b>
            </div>
          </div>

          {/* Agent selector */}
          <div className="agentlab-selector">
            {agentShowcase.map((item, index) => (
              <button
                type="button"
                key={item.name}
                aria-label={`Show ${item.name}`}
                className={index === activeAgent ? "active" : ""}
                onClick={() => setActiveAgent(index)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);

  /* ---------------------------------------------------------------- */
  /* DRIVE MOVING DOTS ALONG SVG PATHS                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const items = dotPaths
      .map((p, i) => {
        const path = svg.querySelector<SVGPathElement>(`#${p.id}`);
        const circle = circleRefs.current[i];

        if (!path || !circle) return null;

        return {
          ...p,
          path,
          circle,
          length: path.getTotalLength(),
        };
      })
      .filter(Boolean) as Array<
      ConnPath & {
        path: SVGPathElement;
        circle: SVGCircleElement;
        length: number;
      }
    >;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      for (const item of items) {
        const elapsed =
          (now - start + item.delay) % item.duration;

        const progress = elapsed / item.duration;

        const point = item.path.getPointAtLength(
          progress * item.length
        );

        item.circle.setAttribute(
          "cx",
          String(point.x)
        );

        item.circle.setAttribute(
          "cy",
          String(point.y)
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="site">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap");

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f8faff;
          color: #101a3d;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          text-decoration: none;
        }

        /* ========================================================= */
        /* SITE                                                        */
        /* ========================================================= */

        .site {
          min-height: 100vh;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 69% 47%,
              rgba(101, 93, 255, 0.13),
              transparent 27%
            ),
            radial-gradient(
              circle at 84% 56%,
              rgba(44, 137, 255, 0.08),
              transparent 25%
            ),
            linear-gradient(
              180deg,
              #fbfcff 0%,
              #f7f9ff 100%
            );
        }

        /* ========================================================= */
        /* NAV                                                         */
        /* ========================================================= */

        .nav {
          height: 70px;
          width: 100%;

          display: flex;
          align-items: center;

          border-bottom:
            1px solid
            rgba(30, 50, 100, 0.07);

          background:
            rgba(255, 255, 255, 0.78);

          backdrop-filter: blur(18px);

          position: relative;
          z-index: 50;
        }

        .nav-inner {
          width:
            min(
              1450px,
              calc(100% - 100px)
            );

          margin: auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.8px;
          color: #111a3c;
        }

        .logo span {
          color: #1768f2;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 38px;
          margin-left: 90px;
        }

        .nav-links a,
        .signin {
          color: #34415f;
          font-size: 14px;
          font-weight: 500;

          transition:
            color 0.2s ease;
        }

        .nav-links a:hover,
        .signin:hover {
          color: #1768f2;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .get-started {
          display: flex;
          align-items: center;
          gap: 12px;

          padding: 14px 20px;

          border-radius: 13px;

          background: #1768f2;
          color: white;

          font-size: 14px;
          font-weight: 650;

          box-shadow:
            0 10px 28px
            rgba(23, 104, 242, 0.22);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .get-started:hover {
          transform: translateY(-2px);

          box-shadow:
            0 14px 32px
            rgba(23, 104, 242, 0.3);
        }

        /* ========================================================= */
        /* HERO                                                        */
        /* ========================================================= */

        .hero {
          width:
            min(
              1450px,
              calc(100% - 100px)
            );

          min-height:
            calc(100vh - 70px);

          margin: auto;

          display: grid;

          grid-template-columns:
            40% 60%;

          align-items: center;

          position: relative;
        }

        .hero-copy {
          position: relative;
          z-index: 10;

          padding:
            25px
            20px
            50px
            0;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 14px;

          margin-bottom: 30px;

          color: #637294;

          font-size: 12px;
          font-weight: 700;

          letter-spacing: 2px;

          text-transform: uppercase;
        }

        .eyebrow-line {
          width: 38px;
          height: 2px;

          background: #2d72ff;
        }

        .hero-title {
          margin: 0;

          max-width: 620px;

          font-size:
            clamp(
              55px,
              5.1vw,
              82px
            );

          line-height: 0.98;

          letter-spacing: -4.5px;

          font-weight: 800;

          color: #101a3d;
        }

        .gradient-text {
          display: block;

          background:
            linear-gradient(
              90deg,
              #1768f2 0%,
              #564cff 48%,
              #c52cff 100%
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .hero-description {
          max-width: 575px;

          margin: 32px 0 0;

          color: #596985;

          font-size: 18px;

          line-height: 1.72;

          letter-spacing: -0.15px;
        }

        .hero-buttons {
          display: flex;
          align-items: center;

          gap: 12px;

          margin-top: 34px;
        }

        .primary-button,
        .secondary-button {
          height: 58px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 13px;

          padding: 0 25px;

          border-radius: 13px;

          font-size: 15px;
          font-weight: 650;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .primary-button {
          color: white;

          background: #111a3c;

          box-shadow:
            0 15px 32px
            rgba(17, 26, 60, 0.16);
        }

        .primary-button:hover {
          transform: translateY(-2px);

          box-shadow:
            0 19px 38px
            rgba(17, 26, 60, 0.22);
        }

        .secondary-button {
          color: #182343;

          background:
            rgba(255, 255, 255, 0.82);

          border:
            1px solid
            #dce3f0;
        }

        .secondary-button:hover {
          transform: translateY(-2px);

          border-color: #c8d4e8;

          background: white;
        }

        .play {
          width: 27px;
          height: 27px;

          display: grid;
          place-items: center;

          border:
            1px solid
            #ccd6e6;

          border-radius: 50%;

          font-size: 11px;
        }

        .benefits {
          display: flex;
          align-items: center;

          gap: 27px;

          margin-top: 34px;

          color: #64718c;

          font-size: 13px;
        }

        .benefit {
          display: flex;
          align-items: center;

          gap: 8px;

          white-space: nowrap;
        }

        .check {
          width: 21px;
          height: 21px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background: #eaf1ff;

          color: #1768f2;

          font-size: 12px;
          font-weight: 800;
        }

        /* ========================================================= */
        /* VISUAL                                                       */
        /* ========================================================= */

        .visual-wrap {
          position: relative;

          height: 730px;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-canvas {
          position: relative;

          width: 100%;
          height: 680px;

          overflow: visible;

          border-radius: 38px;

          background:
            radial-gradient(
              circle at 53% 43%,
              rgba(105, 99, 255, 0.15),
              transparent 28%
            ),
            radial-gradient(
              circle at 76% 29%,
              rgba(55, 136, 255, 0.09),
              transparent 23%
            ),
            rgba(250, 252, 255, 0.25);
        }

        /* ========================================================= */
        /* RINGS                                                        */
        /* ========================================================= */

        .canvas-ring {
          position: absolute;

          left: 55%;
          top: 49%;

          width: 450px;
          height: 450px;

          transform:
            translate(-50%, -50%);

          border:
            1px solid
            rgba(96, 120, 220, 0.11);

          border-radius: 50%;

          pointer-events: none;
        }

        .canvas-ring::before,
        .canvas-ring::after {
          content: "";

          position: absolute;

          inset: 35px;

          border:
            1px solid
            rgba(96, 120, 220, 0.09);

          border-radius: 50%;
        }

        .canvas-ring::after {
          inset: 105px;

          border-color:
            rgba(96, 120, 220, 0.08);
        }

        /* ========================================================= */
        /* SVG CONNECTIONS                                              */
        /* ========================================================= */

        .network-svg {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          overflow: visible;

          pointer-events: none;

          z-index: 2;
        }

        .connection {
          fill: none;

          stroke-width: 1.7;

          stroke-dasharray: 6 8;

          opacity: 0.72;
        }

        .connection-blue {
          stroke: #5790ff;
        }

        .connection-green {
          stroke: #2fbf83;
        }

        .connection-pink {
          stroke: #ef65c6;
        }

        .connection-purple {
          stroke: #8274ff;
        }

        .connection-orange {
          stroke: #f7a33d;
        }

        .connection-out {
          stroke: #8a6dff;
        }

        /* ========================================================= */
        /* INPUT CARDS                                                  */
        /* ========================================================= */

        .input-card {
          position: absolute;

          left: 4%;

          width: 196px;
          height: 68px;

          padding: 10px 14px;

          display: flex;
          align-items: center;

          gap: 12px;

          border:
            1px solid
            rgba(214, 223, 241, 0.9);

          border-radius: 15px;

          background:
            rgba(255, 255, 255, 0.88);

          box-shadow:
            0 15px 35px
            rgba(65, 91, 160, 0.08),
            inset 0 1px 0
            rgba(255, 255, 255, 0.9);

          backdrop-filter: blur(14px);

          z-index: 5;
        }

        .input-1 {
          top: 118px;
        }

        .input-2 {
          top: 206px;
        }

        .input-3 {
          top: 294px;
        }

        .input-4 {
          top: 382px;
        }

        .input-5 {
          top: 470px;
        }

        .mini-icon {
          width: 40px;
          height: 40px;

          flex: 0 0 40px;

          display: grid;
          place-items: center;

          border-radius: 12px;
        }

        .tone-blue {
          background: #eef4ff;
          color: #397cff;
        }

        .tone-green {
          background: #e9fbf3;
          color: #17ab6f;
        }

        .tone-pink {
          background: #fff0f8;
          color: #ed63bd;
        }

        .tone-purple {
          background: #f1efff;
          color: #7367ff;
        }

        .tone-orange {
          background: #fff6e9;
          color: #f2a137;
        }

        .tone-indigo {
          background: #eef1fd;
          color: #4a55c9;
        }

        .tone-violet {
          background: #f3edff;
          color: #8b3fe0;
        }

        .input-title {
          font-size: 13px;
          font-weight: 700;

          color: #202c49;
        }

        .input-subtitle {
          margin-top: 3px;

          color: #9aa7bd;

          font-size: 10px;
        }

        /* ========================================================= */
        /* ANNOTATIONS                                                  */
        /* ========================================================= */

        .annotation {
          position: absolute;

          font-family: "Caveat", cursive;

          font-size: 19px;

          line-height: 1.15;

          color: #4c5ad0;

          z-index: 25;

          pointer-events: none;
        }

        .annotation-sources {
          top: 6px;

          left: 18%;

          width: 150px;

          text-align: right;
        }

        .annotation-loop {
          right: -1%;

          bottom: 118px;

          width: 145px;

          text-align: left;

          color: #b5399a;

          font-size: 18px;

          line-height: 1.05;
        }

        .annotation-svg {
          position: absolute;

          overflow: visible;

          z-index: 26;

          pointer-events: none;
        }

        /* ========================================================= */
        /* CENTRAL STACK                                                 */
        /* ========================================================= */

        .brain {
          position: absolute;

          left: 55%;
          top: 52%;

          width: 240px;
          height: 260px;

          transform:
            translate(-50%, -50%);

          z-index: 8;
        }

        .layer {
          position: absolute;

          left: 50%;

          height: 62px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          border:
            1px solid
            rgba(145, 158, 240, 0.34);

          font-size: 12.5px;

          font-weight: 800;

          letter-spacing: 0.7px;

          backdrop-filter: blur(12px);

          transform-style: preserve-3d;

          box-shadow:
            0 18px 32px
            rgba(83, 83, 190, 0.12),
            inset 0 1px 0
            rgba(255, 255, 255, 0.8);
        }

        .layer::after {
          content: "";

          position: absolute;

          left: 10px;
          right: 10px;

          bottom: -7px;

          height: 10px;

          border-radius:
            0 0 16px 16px;

          background: inherit;

          filter: brightness(0.9);

          opacity: 0.55;

          transform:
            scaleY(0.6);

          transform-origin: top;

          z-index: -1;
        }

        .layer-1 {
          top: 0;

          width: 190px;

          transform:
            translateX(-50%)
            perspective(600px)
            rotateX(4deg);

          background:
            linear-gradient(
              135deg,
              rgba(222, 236, 255, 0.94),
              rgba(201, 221, 255, 0.74)
            );

          color: #2671e9;
        }

        .layer-2 {
          top: 62px;

          width: 214px;

          transform:
            translateX(-50%)
            perspective(600px)
            rotateX(4deg);

          background:
            linear-gradient(
              135deg,
              rgba(224, 222, 255, 0.94),
              rgba(211, 208, 255, 0.74)
            );

          color: #6352e9;
        }

        .layer-3 {
          top: 124px;

          width: 238px;

          transform:
            translateX(-50%)
            perspective(600px)
            rotateX(4deg);

          background:
            linear-gradient(
              135deg,
              rgba(255, 224, 247, 0.94),
              rgba(250, 204, 239, 0.72)
            );

          color: #df39aa;
        }

        .layer-4 {
          top: 186px;

          width: 262px;

          transform:
            translateX(-50%)
            perspective(600px)
            rotateX(4deg);

          background:
            linear-gradient(
              135deg,
              rgba(255, 239, 216, 0.96),
              rgba(255, 220, 177, 0.74)
            );

          color: #e8751e;
        }

        .core-dot {
          position: absolute;

          left: 50%;
          top: 130px;

          width: 14px;
          height: 14px;

          transform:
            translate(-50%, -50%);

          border-radius: 50%;

          background: white;

          box-shadow:
            0 0 0 7px
            rgba(255, 255, 255, 0.3),
            0 0 25px
            rgba(104, 93, 255, 0.7);

          z-index: 15;
        }

        /* ========================================================= */
        /* KNOWLEDGE PANEL                                              */
        /* ========================================================= */

        .context-panel {
          position: absolute;

          left: 55%;
          top: 7%;

          width: 250px;

          transform:
            translateX(-50%);

          padding: 16px 18px;

          display: flex;
          align-items: center;

          gap: 14px;

          border-radius: 20px;

          border:
            1px solid
            rgba(150, 175, 255, 0.35);

          background:
            linear-gradient(
              160deg,
              rgba(226, 234, 255, 0.85),
              rgba(210, 222, 255, 0.55)
            );

          box-shadow:
            0 20px 40px
            rgba(90, 110, 210, 0.14);

          backdrop-filter: blur(14px);

          z-index: 7;
        }

        .context-graph {
          position: relative;

          width: 62px;
          height: 52px;

          flex: 0 0 62px;
        }

        .context-graph-line {
          position: absolute;

          height: 1px;

          background:
            rgba(85, 100, 200, 0.4);

          transform-origin: left center;
        }

        .context-graph-dot {
          position: absolute;

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #5c62e0;
        }

        .context-text {
          display: grid;

          gap: 4px;

          font-size: 11px;

          font-weight: 750;

          letter-spacing: 0.5px;

          color: #3d4bb8;
        }

        .context-connector {
          position: absolute;

          left: 55%;

          top:
            calc(7% + 108px);

          width: 1px;

          height: 46px;

          background:
            repeating-linear-gradient(
              to bottom,
              rgba(120, 135, 230, 0.55)
                0 5px,
              transparent
                5px 10px
            );

          z-index: 6;
        }

        .status-dot {
          position: absolute;

          top: 14px;
          right: 16px;

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #13ce85;

          box-shadow:
            0 0 12px
            rgba(19, 206, 133, 0.6);
        }

        /* ========================================================= */
        /* MEANINGFUL OUTCOMES                                         */
        /* ========================================================= */

        .outcomes-card {
          position: absolute;

          top: 205px;

          right: -1%;

          width: 210px;

          padding: 19px 17px;

          border:
            1px solid
            rgba(218, 225, 241, 0.95);

          border-radius: 20px;

          background:
            rgba(255, 255, 255, 0.94);

          box-shadow:
            0 20px 45px
            rgba(68, 89, 150, 0.1);

          backdrop-filter: blur(15px);

          z-index: 20;
        }

        .card-heading {
          color: #26334f;

          font-size: 12px;

          font-weight: 750;
        }

        .outcome-list {
          display: grid;

          gap: 10px;

          margin-top: 14px;
        }

        .outcome {
          display: flex;
          align-items: center;

          gap: 11px;

          color: #65718a;

          font-size: 11px;

          font-weight: 600;
        }

        .outcome-icon {
          width: 30px;
          height: 30px;

          flex: 0 0 30px;

          display: grid;
          place-items: center;

          border-radius: 9px;
        }

        /* ========================================================= */
        /* BOTTOM INTELLIGENCE LOOP                                    */
        /* ========================================================= */

        .loop-label {
          position: absolute;

          z-index: 30;

          padding: 8px 18px;

          border:
            1px solid
            rgba(217, 224, 240, 0.95);

          border-radius: 30px;

          background:
            rgba(255, 255, 255, 0.92);

          box-shadow:
            0 8px 20px
            rgba(72, 87, 145, 0.07);

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 0.8px;

          white-space: nowrap;
        }

        .learn {
          left: 38%;

          bottom: 65px;

          color: #347aff;
        }

        .improve {
          left: 53%;

          bottom: 18px;

          color: #725cff;
        }

        .evolve {
          right: 12%;

          bottom: 65px;

          color: #e52cab;
        }

        /* ========================================================= */
        /* SMALL AMBIENT DOTS                                          */
        /* ========================================================= */

        .ambient {
          position: absolute;

          width: 5px;
          height: 5px;

          border-radius: 50%;

          opacity: 0.65;

          animation:
            ambientFloat
            5s
            ease-in-out
            infinite;
        }

        .ambient-1 {
          left: 46%;
          top: 18%;

          background: #5e8fff;
        }

        .ambient-2 {
          left: 77%;
          top: 48%;

          background: #d44aff;

          animation-delay: 1s;
        }

        .ambient-3 {
          left: 61%;
          bottom: 20%;

          background: #f49d39;

          animation-delay: 2s;
        }

        @keyframes ambientFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-9px);
          }
        }

        /* ========================================================= */
        /* JASEIR SERVICES — EDITORIAL + PRODUCT SHOWCASE            */
        /* ========================================================= */

        .jaseir-services-section {
          position: relative;
          overflow: hidden;
          padding: 138px 0 132px;
          background: #ffffff;
          border-top: 1px solid rgba(16, 26, 61, 0.06);
        }

        .jaseir-services-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.7;
          background-image:
            linear-gradient(90deg, rgba(79, 136, 255, 0.075) 1px, transparent 1px),
            linear-gradient(rgba(79, 136, 255, 0.045) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: linear-gradient(90deg, transparent 0%, black 43%, black 100%);
        }

        .jaseir-services-inner {
          position: relative;
          z-index: 2;
          width: min(1450px, calc(100% - 100px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 48% 52%;
          align-items: center;
        }

        .jaseir-services-copy {
          position: relative;
          z-index: 5;
          padding-right: 54px;
        }

        .services-eyebrow {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 28px;
          color: #1768f2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2.3px;
        }

        .services-eyebrow > span {
          width: 36px;
          height: 2px;
          background: #397cff;
        }

        .services-title {
          margin: 0;
          max-width: 650px;
          color: #101a3d;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(52px, 5.1vw, 82px);
          line-height: 0.96;
          letter-spacing: -4px;
          font-weight: 500;
        }

        .services-title em {
          color: #397cff;
          font-style: normal;
        }

        .services-intro {
          max-width: 620px;
          margin: 30px 0 44px;
          color: #657391;
          font-size: 17px;
          line-height: 1.7;
        }

        .services-list {
          width: 100%;
          border-top: 1px solid #e4e8f1;
        }

        .service-row {
          width: 100%;
          min-height: 78px;
          padding: 0 0;
          display: grid;
          grid-template-columns: 42px 48px minmax(0, 1fr) 40px;
          align-items: center;
          gap: 10px;
          border: 0;
          border-bottom: 1px solid #e4e8f1;
          background: transparent;
          color: #152043;
          text-align: left;
          cursor: pointer;
          transition: background 0.35s ease, min-height 0.35s ease;
        }

        .service-row {
          position: relative;
          overflow: hidden;
        }

        .service-row::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 2px;
          background: var(--accent, #7559ee);
          opacity: 0;
        }

        .service-row.is-active::after {
          width: 100%;
          opacity: 1;
          transition: width 4.5s linear;
        }

        .service-row.is-active {
          min-height: 112px;
          padding: 10px 0;
          background: linear-gradient(90deg, rgba(245, 247, 255, 0.9), rgba(245, 247, 255, 0.25));
        }

        .service-number {
          align-self: start;
          padding-top: 27px;
          color: #a1aec4;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 700;
        }

        .service-row.is-active .service-number {
          padding-top: 17px;
        }

        .service-row-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          transition: transform 0.35s ease;
        }

        .service-row:hover .service-row-icon,
        .service-row.is-active .service-row-icon {
          transform: translateY(-2px);
        }

        .service-row-icon-violet { background: #f0edff; color: #7559ee; }
        .service-row-icon-coral { background: #fff0ed; color: #ef654e; }
        .service-row-icon-gold { background: #fff7e8; color: #ec9b26; }
        .service-row-icon-mint { background: #eafbf3; color: #18a974; }

        .service-row-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .service-row-content strong {
          color: #182345;
          font-size: 18px;
          line-height: 1.25;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .service-row-description {
          max-width: 610px;
          margin-top: 9px;
          color: #7886a4;
          font-size: 13px;
          line-height: 1.55;
        }

        .service-row-arrow {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          justify-self: end;
          border: 1px solid #dfe5f0;
          border-radius: 50%;
          color: #75829d;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .service-row.is-active .service-row-arrow {
          border-color: #172243;
          background: #172243;
          color: #ffffff;
        }

        .jaseir-services-visual {
          position: relative;
          min-height: 650px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-showcase {
          --accent: #7559ee;
          --accent-soft: #f0edff;
          --panel: #f4f1ff;
          position: relative;
          width: min(720px, 100%);
          height: 610px;
          transition: --accent 0.6s ease;
        }

        .service-theme-violet { --accent: #7559ee; --accent-soft: #f0edff; --panel: #f7f3ff; }
        .service-theme-coral { --accent: #ef654e; --accent-soft: #fff0ed; --panel: #fff5f2; }
        .service-theme-gold { --accent: #dc991f; --accent-soft: #fff7e8; --panel: #fffaf0; }
        .service-theme-mint { --accent: #18a974; --accent-soft: #eafbf3; --panel: #f1fcf7; }

        .service-grid-bg {
          position: absolute;
          inset: 32px 0 10px;
          border: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
          background-image:
            linear-gradient(color-mix(in srgb, var(--accent) 12%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, transparent) 1px, transparent 1px);
          background-size: 78px 78px;
        }

        .service-orbit {
          position: absolute;
          left: 55%;
          top: 51%;
          border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .service-orbit-one { width: 470px; height: 470px; }
        .service-orbit-two { width: 300px; height: 300px; }

        .service-floating-label {
          position: absolute;
          left: 40px;
          top: 20px;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border: 1px solid #e2e7f0;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          color: #63718e;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 10px 28px rgba(50,70,120,0.08);
          animation: serviceLabelIn 0.5s ease both;
        }

        .service-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 12%, transparent);
        }

        .service-back-panel,
        .service-front-panel {
          position: absolute;
          border: 1px solid color-mix(in srgb, var(--accent) 42%, white);
          box-shadow: 0 30px 70px rgba(42, 57, 100, 0.12);
          animation: servicePanelIn 0.65s cubic-bezier(.2,.75,.2,1) both;
        }

        .service-back-panel {
          width: 440px;
          height: 370px;
          left: 58px;
          top: 95px;
          z-index: 3;
          background: color-mix(in srgb, var(--accent) 18%, white);
        }

        .service-front-panel {
          width: 465px;
          min-height: 455px;
          right: 18px;
          top: 160px;
          z-index: 5;
          background: rgba(255,255,255,0.96);
          animation-delay: 0.06s;
        }

        .service-window-top,
        .service-front-top {
          height: 52px;
          padding: 0 17px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 25%, white);
        }

        .service-window-top strong,
        .service-front-top strong {
          color: color-mix(in srgb, var(--accent) 70%, #182345);
          font-size: 13px;
          font-weight: 800;
        }

        .window-dots {
          display: flex;
          gap: 4px;
        }

        .window-dots i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 35%, white);
        }

        .window-status {
          margin-left: auto;
          color: var(--accent);
          font-size: 8px;
          font-weight: 800;
        }

        .service-back-content {
          padding: 30px;
        }

        .service-back-heading > span {
          color: var(--accent);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }

        .service-back-heading h4 {
          margin: 9px 0 5px;
          color: color-mix(in srgb, var(--accent) 62%, #182345);
          font-size: 28px;
          letter-spacing: -1px;
        }

        .service-back-heading p {
          max-width: 300px;
          margin: 0;
          color: color-mix(in srgb, var(--accent) 45%, #687692);
          font-size: 12px;
          line-height: 1.6;
        }

        .service-metric-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 35px;
          border-top: 1px solid color-mix(in srgb, var(--accent) 18%, white);
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 18%, white);
        }

        .service-metric-row div {
          padding: 16px 0;
        }

        .service-metric-row div + div {
          padding-left: 18px;
          border-left: 1px solid color-mix(in srgb, var(--accent) 18%, white);
        }

        .service-metric-row span {
          display: block;
          color: color-mix(in srgb, var(--accent) 45%, #8c98ad);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .service-metric-row strong {
          display: block;
          margin-top: 6px;
          color: color-mix(in srgb, var(--accent) 65%, #26334f);
          font-size: 13px;
        }

        .service-bars {
          display: grid;
          gap: 9px;
          margin-top: 24px;
        }

        .service-bars span {
          display: block;
          height: 7px;
          border-radius: 999px;
          background: var(--accent);
          opacity: 0.42;
          transform-origin: left;
          animation: serviceBarIn 0.9s ease both;
        }

        .service-bars span:nth-child(2) { animation-delay: 0.12s; }
        .service-bars span:nth-child(3) { animation-delay: 0.24s; }

        .service-front-top .front-chip {
          margin-left: auto;
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 7px;
          font-weight: 850;
          letter-spacing: 0.8px;
        }

        .service-front-body {
          padding: 29px 30px 20px;
        }

        .service-ai-mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border: 1px solid color-mix(in srgb, var(--accent) 20%, white);
          border-radius: 13px;
          background: var(--accent-soft);
          color: var(--accent);
          animation: serviceMarkPulse 2.5s ease-in-out infinite;
        }

        .service-ai-mark svg {
          width: 24px;
          height: 24px;
        }

        .service-front-body h3 {
          margin: 19px 0 7px;
          color: #182345;
          font-size: 27px;
          letter-spacing: -1px;
        }

        .service-front-body > p {
          max-width: 360px;
          margin: 0;
          color: #72809c;
          font-size: 12px;
          line-height: 1.65;
        }

        .service-process {
          margin-top: 23px;
          border-top: 1px solid #e9edf4;
        }

        .service-process-item {
          min-height: 43px;
          display: grid;
          grid-template-columns: 30px 1fr 24px;
          align-items: center;
          border-bottom: 1px solid #e9edf4;
          color: #40506f;
          font-size: 11px;
          font-weight: 700;
        }

        .process-number {
          color: #a5afc1;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
        }

        .service-process-item b {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 9px;
        }

        .service-front-footer {
          height: 50px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #e8ecf3;
          color: #8895ad;
          font-size: 9px;
          font-weight: 750;
        }

        .service-front-footer span:first-child {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .service-front-footer i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }

        .service-front-footer span:last-child {
          color: var(--accent);
        }

        .service-result-card {
          position: absolute;
          right: -2px;
          bottom: 32px;
          z-index: 8;
          width: 250px;
          min-height: 70px;
          padding: 11px 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e7f0;
          background: rgba(255,255,255,0.97);
          box-shadow: 0 22px 45px rgba(42,57,100,0.14);
          animation: serviceResultFloat 3.2s ease-in-out infinite;
        }

        .service-result-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--accent-soft);
          color: var(--accent);
        }

        .service-result-icon svg {
          width: 17px;
          height: 17px;
        }

        .service-result-card div:nth-child(2) {
          min-width: 0;
        }

        .service-result-card span {
          display: block;
          color: #a0aabd;
          font-size: 6.5px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .service-result-card strong {
          display: block;
          margin-top: 3px;
          color: #26334f;
          font-size: 10px;
        }

        .service-result-card > b {
          margin-left: auto;
          color: var(--accent);
          font-size: 16px;
        }

        @keyframes servicePanelIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes serviceLabelIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes serviceBarIn {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 0.42; }
        }

        @keyframes serviceMarkPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 transparent; }
          50% { transform: scale(1.035); box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 18%, transparent); }
        }

        @keyframes serviceResultFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @media (max-width: 1150px) {
          .jaseir-services-inner {
            width: min(100% - 48px, 1100px);
            grid-template-columns: 50% 50%;
          }

          .jaseir-services-copy { padding-right: 28px; }
          .services-title { font-size: clamp(48px, 5.5vw, 68px); }
          .jaseir-services-visual { min-height: 570px; }
          .service-showcase { transform: scale(0.88); transform-origin: center; }
        }

        @media (max-width: 900px) {
          .jaseir-services-section { padding: 92px 0 90px; }
          .jaseir-services-grid { mask-image: linear-gradient(180deg, transparent 0%, black 38%, black 100%); }
          .jaseir-services-inner { grid-template-columns: 1fr; }
          .jaseir-services-copy { padding-right: 0; }
          .services-title { max-width: 700px; font-size: clamp(50px, 8vw, 76px); }
          .services-intro { max-width: 680px; }
          .jaseir-services-visual { min-height: 610px; margin-top: 42px; }
          .service-showcase { transform: scale(0.94); }
        }

        @media (max-width: 620px) {
          .jaseir-services-section { padding: 72px 0; }
          .jaseir-services-inner { width: calc(100% - 32px); }
          .services-title { font-size: 45px; line-height: 0.98; letter-spacing: -2.4px; }
          .services-intro { font-size: 15px; margin-bottom: 30px; }
          .service-row { grid-template-columns: 28px 40px minmax(0,1fr) 32px; gap: 7px; min-height: 70px; }
          .service-row {
          position: relative;
          overflow: hidden;
        }

        .service-row::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 2px;
          background: var(--accent, #7559ee);
          opacity: 0;
        }

        .service-row.is-active::after {
          width: 100%;
          opacity: 1;
          transition: width 4.5s linear;
        }

        .service-row.is-active { min-height: 125px; }
          .service-row-icon { width: 36px; height: 36px; border-radius: 10px; }
          .service-row-content strong { font-size: 14px; }
          .service-row-description { font-size: 11px; }
          .service-row-arrow { width: 28px; height: 28px; }
          .jaseir-services-visual { min-height: 455px; margin-top: 20px; overflow: hidden; }
          .service-showcase { width: 620px; height: 500px; transform: scale(0.68); transform-origin: center top; margin-top: -5px; }
        }

        /* ========================================================= */
        /* TRUSTED BY TEAMS (centered, auto-scrolling marquee)         */
        /* ========================================================= */

        .trusted-section {
          width: 100%;
          padding: 42px 0;

          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 26px;

          border-top: 1px solid rgba(30, 50, 100, 0.07);

          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.76) 0%,
              rgba(250, 252, 255, 0.9) 100%
            );

          overflow: hidden;
        }

        .trusted-heading {
          color: #9aa7c0;

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 1.35px;
          text-transform: uppercase;

          text-align: center;
          white-space: nowrap;
        }

        .trusted-marquee {
          width: min(1450px, calc(100% - 60px));

          overflow: hidden;

          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            #000 10%,
            #000 90%,
            transparent 100%
          );

          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            #000 10%,
            #000 90%,
            transparent 100%
          );
        }

        .trusted-track {
          display: flex;
          align-items: center;

          gap: 64px;

          width: max-content;

          animation: marqueeScroll 24s linear infinite;
        }

        .trusted-section:hover .trusted-track {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .trusted-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          color: #34415f;

          font-size: 19px;
          font-weight: 700;

          letter-spacing: -0.65px;

          white-space: nowrap;
          opacity: 0.94;

          flex: 0 0 auto;
        }

        .trusted-logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          color: currentColor;
          flex: 0 0 auto;
        }

        .stripe-mark {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1.8px;
        }

        .openai-mark {
          width: 25px;
          height: 25px;

          border: 2.2px solid currentColor;
          border-radius: 8px;

          position: relative;
          transform: rotate(30deg);
        }

        .openai-mark::before {
          content: "";

          position: absolute;
          inset: 4px;

          border: 1.7px solid currentColor;
          border-radius: 50%;
        }

        .notion-mark {
          width: 25px;
          height: 25px;

          border: 2px solid currentColor;
          border-radius: 3px;

          font-size: 15px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .vercel-mark {
          width: 0;
          height: 0;

          border-left: 13px solid transparent;
          border-right: 13px solid transparent;
          border-bottom: 23px solid currentColor;
        }

        .linear-mark {
          width: 25px;
          height: 25px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              transparent 0 28%,
              currentColor 29% 36%,
              transparent 37% 44%,
              currentColor 45% 52%,
              transparent 53% 61%,
              currentColor 62% 69%,
              transparent 70%
            );
        }

        .figma-mark {
          width: 25px;
          height: 25px;

          display: grid;
          grid-template-columns: repeat(2, 10px);
          grid-template-rows: repeat(3, 8px);
          gap: 1px;
        }

        .figma-mark span {
          display: block;
          background: currentColor;
        }

        .figma-mark span:nth-child(1) {
          border-radius: 6px 2px 2px 6px;
        }

        .figma-mark span:nth-child(2) {
          border-radius: 2px 6px 6px 2px;
        }

        .figma-mark span:nth-child(3) {
          border-radius: 6px 2px 2px 6px;
        }

        .figma-mark span:nth-child(4) {
          border-radius: 50%;
        }

        .figma-mark span:nth-child(5) {
          border-radius: 6px 2px 6px 6px;
        }

        .figma-mark span:nth-child(6) {
          display: none;
        }


        .shopify-mark {
          width: 25px;
          height: 25px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border: 2px solid currentColor;
          border-radius: 7px;

          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }



        /* ========================================================= */
        /* HOW IT WORKS (legacy — no longer rendered, kept unused)    */
        /* ========================================================= */

        .how-section {
          position: relative;
          overflow: hidden;
          padding: 105px 0 92px;
          background:
            radial-gradient(circle at 76% 45%, rgba(99, 92, 255, 0.16), transparent 29%),
            radial-gradient(circle at 95% 82%, rgba(44, 137, 255, 0.10), transparent 24%),
            linear-gradient(180deg, #eef3ff 0%, #f8faff 100%);
          border-top: 1px solid rgba(30, 50, 100, 0.06);
          border-bottom: 1px solid rgba(30, 50, 100, 0.06);
        }

        .how-inner {
          width: min(1450px, calc(100% - 100px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 44% 56%;
          gap: 34px;
          align-items: center;
        }

        .how-copy {
          position: relative;
          z-index: 3;
          padding-right: 18px;
        }

        .how-eyebrow {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 26px;
          color: #6d7b9d;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .how-eyebrow-line {
          width: 38px;
          height: 2px;
          background: #377cff;
        }

        .how-title {
          margin: 0;
          max-width: 600px;
          color: #101a3d;
          font-size: clamp(50px, 5vw, 78px);
          line-height: 0.98;
          letter-spacing: -4px;
          font-weight: 800;
        }

        .how-title span {
          display: block;
          background: linear-gradient(90deg, #2374f2 0%, #6252ff 48%, #c42eea 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .how-description {
          max-width: 620px;
          margin: 28px 0 0;
          color: #62718f;
          font-size: 17px;
          line-height: 1.72;
        }

        .how-steps {
          position: relative;
          margin-top: 40px;
          display: grid;
          gap: 19px;
        }

        .how-steps::before {
          content: "";
          position: absolute;
          left: 21px;
          top: 17px;
          bottom: 17px;
          width: 1px;
          background: linear-gradient(
            180deg,
            rgba(55, 124, 255, 0.22),
            rgba(110, 82, 255, 0.20),
            rgba(237, 89, 193, 0.18),
            rgba(243, 160, 59, 0.20)
          );
        }

        .how-step {
          position: relative;
          display: grid;
          grid-template-columns: 42px 44px 1fr;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .how-number {
          position: relative;
          z-index: 2;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(208, 218, 238, 0.95);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.90);
          color: #347aff;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(65, 91, 160, 0.06);
        }

        .how-step-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(220, 227, 241, 0.88);
        }

        .how-step-copy {
          min-width: 0;
        }

        .how-step-title {
          color: #1b2948;
          font-size: 15px;
          font-weight: 750;
        }

        .how-step-description {
          margin-top: 5px;
          color: #8492b0;
          font-size: 12.5px;
          line-height: 1.5;
        }

        /* ========================================================= */
        /* ARCHITECTURE VISUAL (legacy — no longer rendered)          */
        /* ========================================================= */

        .how-architecture {
          position: relative;
          min-height: 600px;
          padding-left: 4px;
        }

        .architecture-stage {
          position: relative;
          width: 100%;
          height: 590px;
        }

        .architecture-orbit {
          position: absolute;
          left: 54%;
          top: 50%;
          width: 570px;
          height: 570px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(102, 122, 205, 0.09);
          border-radius: 50%;
          pointer-events: none;
        }

        .architecture-orbit::before,
        .architecture-orbit::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(102, 122, 205, 0.065);
          border-radius: 50%;
        }

        .architecture-orbit::before { inset: 58px; }
        .architecture-orbit::after { inset: 126px; }

        .architecture-halo {
          position: absolute;
          left: 54%;
          top: 51%;
          width: 460px;
          height: 460px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(95, 99, 255, 0.13) 0%,
            rgba(95, 99, 255, 0.045) 46%,
            transparent 72%
          );
          filter: blur(9px);
          pointer-events: none;
        }

        .architecture-stack {
          position: absolute;
          left: 0;
          top: 50%;
          width: 59%;
          height: 360px;
          transform: translateY(-50%);
          z-index: 4;
        }

        .architecture-layer {
          position: absolute;
          height: 70px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 0 31px 0 38px;
          color: #ffffff;
          border-radius: 11px;
          clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
          box-shadow:
            0 15px 28px rgba(58, 75, 137, 0.14),
            inset 0 1px 0 rgba(255,255,255,0.56);
        }

        .architecture-layer::after {
          content: "";
          position: absolute;
          left: 13px;
          right: 10px;
          bottom: -8px;
          height: 10px;
          border-radius: 0 0 9px 9px;
          background: inherit;
          opacity: 0.34;
          filter: brightness(0.82);
          z-index: -1;
        }

        .architecture-layer-1 {
          top: 0;
          left: 13%;
          width: 78%;
          background: linear-gradient(135deg, #4e8cff 0%, #78a2ff 100%);
        }

        .architecture-layer-2 {
          top: 89px;
          left: 9%;
          width: 83%;
          background: linear-gradient(135deg, #6656ff 0%, #946cf0 100%);
        }

        .architecture-layer-3 {
          top: 178px;
          left: 5%;
          width: 88%;
          background: linear-gradient(135deg, #df4eb8 0%, #ef7fc2 100%);
        }

        .architecture-layer-4 {
          top: 267px;
          left: 1%;
          width: 93%;
          background: linear-gradient(135deg, #f39a31 0%, #f7bd67 100%);
        }

        .architecture-layer-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: 0 0 40px;
          border-radius: 11px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.20);
        }

        .architecture-layer-copy {
          min-width: 0;
        }

        .architecture-layer-name {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .architecture-layer-sub {
          margin-top: 4px;
          font-size: 10.5px;
          opacity: 0.84;
          letter-spacing: 0.15px;
        }

        .architecture-connector {
          position: absolute;
          left: 55.8%;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(91, 108, 183, 0.52) 0%,
            rgba(91, 108, 183, 0.20) 55%,
            rgba(91, 108, 183, 0.04) 100%
          );
          z-index: 3;
        }

        .architecture-connector::before {
          content: "";
          position: absolute;
          left: -5px;
          top: 50%;
          width: 9px;
          height: 9px;
          transform: translateY(-50%);
          border-radius: 50%;
          background: #6575d2;
          box-shadow: 0 0 0 5px rgba(101,117,210,0.10);
        }

        .architecture-connector-1 { top: 150px; }
        .architecture-connector-2 { top: 239px; }
        .architecture-connector-3 { top: 328px; }
        .architecture-connector-4 { top: 417px; }

        .architecture-labels {
          position: absolute;
          left: 57%;
          right: 0;
          top: 50%;
          height: 360px;
          transform: translateY(-50%);
          z-index: 5;
        }

        .architecture-label {
          position: absolute;
          left: 0;
          right: 0;
          min-height: 72px;
          padding: 8px 18px 8px 18px;
          border-left: 2px solid rgba(97, 113, 186, 0.16);
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.34),
            rgba(255,255,255,0.06)
          );
        }

        .architecture-label-1 { top: 114px; }
        .architecture-label-2 { top: 203px; }
        .architecture-label-3 { top: 292px; }
        .architecture-label-4 { top: 381px; }

        .architecture-label-kicker {
          color: #7f8dad;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .architecture-label-title {
          margin-top: 4px;
          color: #1e2b49;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 780;
        }

        .architecture-label-text {
          max-width: 410px;
          margin-top: 5px;
          color: #8291af;
          font-size: 11.5px;
          line-height: 1.48;
        }

        .architecture-note {
          position: absolute;
          right: 3%;
          top: 14px;
          width: 155px;
          color: #6269d8;
          font-family: "Caveat", cursive;
          font-size: 20px;
          line-height: 1.02;
          transform: rotate(-3deg);
          z-index: 8;
        }

        .architecture-note::after {
          content: "";
          position: absolute;
          left: 4px;
          top: 54px;
          width: 78px;
          height: 38px;
          border-top: 1.6px solid #6269d8;
          border-right: 1.6px solid #6269d8;
          border-radius: 0 38px 0 0;
          transform: rotate(17deg);
        }

        .architecture-status {
          position: absolute;
          left: 3%;
          bottom: 8px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 15px;
          border: 1px solid rgba(216,225,241,0.96);
          border-radius: 999px;
          background: rgba(255,255,255,0.78);
          color: #596985;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          box-shadow: 0 10px 22px rgba(65,91,160,0.06);
          z-index: 8;
        }

        .architecture-status::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16bf7a;
          box-shadow: 0 0 0 5px rgba(22,191,122,0.10);
        }

        .impact-strip {
          width: min(1450px, calc(100% - 100px));
          margin: 56px auto 0;
          min-height: 108px;
          padding: 0 28px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          border: 1px solid rgba(222, 228, 241, 0.96);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.66);
          box-shadow: 0 16px 38px rgba(66, 87, 145, 0.06);
          backdrop-filter: blur(10px);
        }

        .impact-metric {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 0 30px;
        }

        .impact-metric + .impact-metric {
          border-left: 1px solid rgba(216, 224, 239, 0.95);
        }

        .impact-metric-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          flex: 0 0 50px;
          border-radius: 50%;
        }

        .impact-metric-number {
          color: #1a2542;
          font-size: 25px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .impact-metric-label {
          margin-top: 5px;
          color: #8190ad;
          font-size: 12px;
        }

        /* ========================================================= */
        /* PLATFORM SECTION (new — Jasper-style 3-column feature grid,*/
        /* now with subtle motion for a more dynamic feel)            */
        /* ========================================================= */

        .platform-section {
          position: relative;
          overflow: hidden;
          padding: 112px 0 104px;
          background: linear-gradient(180deg, #f8faff 0%, #eef3ff 100%);
          border-top: 1px solid rgba(30, 50, 100, 0.06);
          border-bottom: 1px solid rgba(30, 50, 100, 0.06);
        }

        .platform-inner {
          width: min(980px, calc(100% - 100px));
          margin: 0 auto;
          text-align: center;
        }

        .platform-eyebrow {
          display: inline-flex;
          align-items: center;

          padding: 8px 18px;

          border-radius: 999px;

          background: #eaf1ff;
          color: #1768f2;

          font-size: 12px;
          font-weight: 700;

          letter-spacing: 1.6px;
          text-transform: uppercase;

          margin-bottom: 30px;
        }

        .platform-title {
          margin: 0;

          color: #101a3d;

          font-size: clamp(38px, 4.6vw, 60px);

          line-height: 1.08;

          letter-spacing: -2px;

          font-weight: 800;
        }

        .platform-title .gradient-text {
          display: inline;
        }

        .platform-description {
          max-width: 700px;

          margin: 26px auto 0;

          color: #596985;

          font-size: 17px;

          line-height: 1.75;
        }

        .platform-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          height: 56px;

          margin-top: 36px;

          padding: 0 30px;

          border-radius: 13px;

          background: #111a3c;
          color: #fff;

          font-size: 15px;
          font-weight: 650;

          box-shadow: 0 15px 32px rgba(17, 26, 60, 0.16);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .platform-cta:hover {
          transform: translateY(-2px);

          box-shadow: 0 19px 38px rgba(17, 26, 60, 0.22);
        }

        .platform-grid {
          width: min(1450px, calc(100% - 100px));

          margin: 72px auto 0;

          display: grid;
          grid-template-columns: repeat(3, 1fr);

          gap: 28px;
        }

        .platform-card {
          position: relative;

          display: flex;
          flex-direction: column;

          border-radius: 24px;

          overflow: hidden;

          border: 1px solid rgba(30, 50, 100, 0.06);

          background: #ffffff;

          box-shadow: 0 20px 45px rgba(66, 87, 145, 0.07);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .platform-card:hover {
          transform: translateY(-4px);

          box-shadow: 0 26px 55px rgba(66, 87, 145, 0.12);
        }

        .platform-card-head {
          padding: 28px 28px 6px;
        }

        .platform-card-head h3 {
          margin: 0;

          color: #101a3d;

          font-size: 26px;

          font-weight: 800;

          letter-spacing: -0.7px;
        }

        .platform-card-visual {
          position: relative;

          height: 220px;

          margin: 20px 16px 0;

          border-radius: 16px;

          overflow: hidden;

          background-image:
            linear-gradient(rgba(16, 26, 61, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 26, 61, 0.055) 1px, transparent 1px);

          background-size: 26px 26px;

          animation: gridDrift 7s linear infinite;
        }

        @keyframes gridDrift {
          from {
            background-position: 0 0, 0 0;
          }

          to {
            background-position: 26px 26px, 26px 26px;
          }
        }

        .platform-card-visual::before {
          content: "";

          position: absolute;

          top: 18%;
          left: 8%;

          width: 150px;
          height: 150px;

          border-radius: 50%;

          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.6),
            transparent 70%
          );

          filter: blur(4px);

          animation: blobDrift 9s ease-in-out infinite;

          pointer-events: none;
        }

        @keyframes blobDrift {
          0%,
          100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(55%, 35%);
          }
        }

        .platform-card-green .platform-card-visual {
          background-color: #e6fbee;
        }

        .platform-card-peach .platform-card-visual {
          background-color: #fff1e6;
        }

        .platform-card-blue .platform-card-visual {
          background-color: #eaf1ff;
        }

        .platform-card-icon {
          position: absolute;

          width: 52px;
          height: 52px;

          display: grid;
          place-items: center;

          border-radius: 14px;

          background: rgba(255, 255, 255, 0.85);

          border: 1px solid rgba(16, 26, 61, 0.1);

          box-shadow: 0 12px 24px rgba(16, 26, 61, 0.08);

          backdrop-filter: blur(6px);

          animation: cardIconFloat 4.5s ease-in-out infinite;
        }

        @keyframes cardIconFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        /* ========================================================= */
        /* AI PRODUCT VISUALS INSIDE PLATFORM CARDS                  */
        /* ========================================================= */

        .ai-mini-ui {
          position: absolute;
          inset: 0;
          padding: 16px;
          color: #26334f;
          font-size: 10px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          display: inline-block;
          flex: 0 0 6px;
          border-radius: 50%;
          background: #18c987;
          box-shadow: 0 0 10px rgba(24, 201, 135, 0.65);
          animation: livePulse 1.8s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 0.65; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* AGENTS */
        .agent-ui {
          padding: 16px;
        }

        .ai-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(30, 50, 100, 0.08);
          color: #62718f;
          font-size: 9px;
          font-weight: 750;
          box-shadow: 0 5px 15px rgba(40, 70, 130, 0.05);
        }

        .agent-flow {
          position: relative;
          margin-top: 11px;
        }

        .agent-node {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 39px;
          padding: 6px 9px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(30, 50, 100, 0.08);
          box-shadow: 0 7px 18px rgba(40, 70, 130, 0.055);
          backdrop-filter: blur(8px);
        }

        .agent-node strong,
        .workflow-node strong,
        .agent-result strong {
          display: block;
          color: #25314e;
          font-size: 9.5px;
          font-weight: 800;
        }

        .agent-node small,
        .workflow-node small,
        .agent-result small {
          display: block;
          margin-top: 2px;
          color: #8a97af;
          font-size: 7.5px;
          line-height: 1.2;
        }

        .node-icon,
        .brain-glow {
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #eef4ff;
          color: #397cff;
        }

        .node-icon svg,
        .brain-glow svg,
        .workflow-node-icon svg,
        .source-icon svg,
        .answer-sparkle svg {
          width: 14px;
          height: 14px;
        }

        .brain-glow {
          background: #f1efff;
          color: #7367ff;
          animation: aiGlow 2.2s ease-in-out infinite;
        }

        @keyframes aiGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(115, 103, 255, 0); }
          50% { box-shadow: 0 0 18px rgba(115, 103, 255, 0.25); }
        }

        .agent-brain-node {
          position: relative;
        }

        .thinking-bars {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
        }

        .thinking-bars i {
          width: 2px;
          height: 7px;
          border-radius: 3px;
          background: #7367ff;
          animation: thinking 1s ease-in-out infinite;
        }

        .thinking-bars i:nth-child(2) { animation-delay: 0.15s; }
        .thinking-bars i:nth-child(3) { animation-delay: 0.3s; }

        @keyframes thinking {
          0%, 100% { height: 4px; opacity: 0.45; }
          50% { height: 11px; opacity: 1; }
        }

        .flow-line {
          height: 10px;
          position: relative;
          margin-left: 21px;
        }

        .flow-line::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(89, 111, 190, 0.25);
        }

        .flow-line span {
          position: absolute;
          left: -2px;
          top: 0;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #5d87ff;
          animation: flowDown 1.8s linear infinite;
        }

        @keyframes flowDown {
          from { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          to { transform: translateY(8px); opacity: 0; }
        }

        .agent-tools {
          display: flex;
          gap: 5px;
        }

        .tool-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 6px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(30, 50, 100, 0.07);
          color: #7b88a2;
          font-size: 7.5px;
          font-weight: 700;
        }

        .tool-pill svg {
          width: 10px;
          height: 10px;
        }

        .active-tool {
          color: #e8751e;
          background: #fff7eb;
        }

        .agent-result {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 9px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.93);
          border: 1px solid rgba(30, 50, 100, 0.08);
          box-shadow: 0 9px 22px rgba(40, 70, 130, 0.07);
          animation: resultFloat 3s ease-in-out infinite;
        }

        @keyframes resultFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .result-check {
          width: 21px;
          height: 21px;
          flex: 0 0 21px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #e9fbf3;
          color: #16ad70;
          font-size: 11px;
          font-weight: 900;
        }

        .result-arrow {
          margin-left: auto;
          color: #16ad70;
          font-size: 14px;
          font-weight: 800;
        }

        /* WORKFLOWS */
        .workflow-ui {
          padding: 15px;
        }

        .workflow-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .workflow-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #5f6d88;
          font-size: 8.5px;
          font-weight: 800;
        }

        .workflow-running {
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.75);
          color: #14a86c;
          border: 1px solid rgba(20, 168, 108, 0.12);
          font-size: 7.5px;
          font-weight: 800;
        }

        .workflow-canvas {
          position: relative;
          height: 151px;
          margin-top: 8px;
        }

        .workflow-node {
          position: absolute;
          width: 105px;
          min-height: 37px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 7px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(30, 50, 100, 0.08);
          box-shadow: 0 7px 17px rgba(70, 75, 120, 0.06);
          backdrop-filter: blur(8px);
          z-index: 3;
        }

        .workflow-node-icon {
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #fff5e8;
          color: #ed9631;
        }

        .node-ai .workflow-node-icon {
          background: #f2efff;
          color: #7562ee;
        }

        .node-action .workflow-node-icon {
          background: #eaf1ff;
          color: #397cff;
        }

        .node-complete .workflow-node-icon {
          background: #e9fbf3;
          color: #18ad70;
        }

        .node-trigger { left: 0; top: 4px; }
        .node-ai { right: 0; top: 4px; }
        .node-action { left: 0; bottom: 4px; }
        .node-complete { right: 0; bottom: 4px; }

        .workflow-path {
          position: absolute;
          z-index: 1;
          border-top: 1.5px dashed rgba(110, 108, 185, 0.28);
        }

        .path-one {
          left: 97px;
          right: 97px;
          top: 22px;
        }

        .path-two {
          left: 52px;
          width: 1px;
          height: 82px;
          top: 39px;
          border-top: 0;
          border-left: 1.5px dashed rgba(110, 108, 185, 0.28);
        }

        .path-three {
          left: 52px;
          right: 52px;
          bottom: 22px;
        }

        .workflow-pulse {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #806cf2;
          box-shadow: 0 0 12px rgba(128, 108, 242, 0.45);
          z-index: 2;
          animation: workflowTravel 3.4s linear infinite;
        }

        .pulse-one {
          top: 19px;
          left: 97px;
          animation-name: pulseHorizontal;
        }

        .pulse-two {
          top: 39px;
          left: 49px;
          animation-name: pulseVertical;
          animation-delay: 1.1s;
        }

        .pulse-three {
          bottom: 19px;
          left: 52px;
          animation-name: pulseBottom;
          animation-delay: 2s;
        }

        @keyframes pulseHorizontal {
          0% { transform: translateX(0); opacity: 0; }
          12% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(88px); opacity: 0; }
        }

        @keyframes pulseVertical {
          0% { transform: translateY(0); opacity: 0; }
          12% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(70px); opacity: 0; }
        }

        @keyframes pulseBottom {
          0% { transform: translateX(0); opacity: 0; }
          12% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(88px); opacity: 0; }
        }

        .workflow-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #9aa6bb;
          font-size: 7.5px;
          font-weight: 700;
        }

        /* JASEIR IQ */
        .iq-ui {
          padding: 15px;
        }

        .iq-search {
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 31px;
          padding: 6px 8px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(72, 95, 170, 0.10);
          box-shadow: 0 7px 18px rgba(70, 85, 150, 0.055);
          color: #64718e;
          font-size: 7.5px;
          font-weight: 650;
        }

        .search-icon {
          color: #6476d9;
          font-size: 14px;
          line-height: 1;
        }

        .search-enter {
          margin-left: auto;
          color: #9ba8bd;
          font-size: 10px;
        }

        .iq-processing {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 9px;
          padding: 8px 9px;
          border-radius: 10px;
          background: rgba(238, 242, 255, 0.78);
          border: 1px solid rgba(92, 105, 207, 0.10);
        }

        .iq-orb {
          width: 29px;
          height: 29px;
          flex: 0 0 29px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: linear-gradient(135deg, #ffffff, #e4e4ff);
          color: #665ce8;
          box-shadow: 0 0 20px rgba(100, 92, 232, 0.20);
          animation: iqOrb 2.4s ease-in-out infinite;
        }

        @keyframes iqOrb {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.07); }
        }

        .iq-processing-copy {
          flex: 1;
          min-width: 0;
        }

        .iq-processing-copy strong {
          display: block;
          color: #4d55bd;
          font-size: 8.5px;
          font-weight: 850;
        }

        .iq-processing-copy small {
          display: block;
          margin-top: 3px;
          color: #8c98b0;
          font-size: 7px;
        }

        .iq-progress {
          height: 3px;
          margin-top: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(95, 101, 200, 0.10);
        }

        .iq-progress span {
          display: block;
          width: 64%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #b25cff);
          animation: iqProgress 2.6s ease-in-out infinite;
        }

        @keyframes iqProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(145%); }
        }

        .iq-sources {
          margin-top: 8px;
          padding: 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(72, 95, 170, 0.08);
        }

        .source-title {
          display: flex;
          justify-content: space-between;
          color: #65728e;
          font-size: 7.5px;
          font-weight: 800;
        }

        .source-title b {
          color: #665ce8;
        }

        .source-items {
          display: grid;
          gap: 5px;
          margin-top: 6px;
        }

        .source-item {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 4px 5px;
          border-radius: 6px;
          background: rgba(242, 244, 255, 0.72);
          color: #77839b;
          font-size: 7px;
        }

        .source-item > span:nth-child(2) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .source-item b {
          margin-left: auto;
          color: #8b79dd;
          font-size: 6.5px;
          font-weight: 800;
        }

        .source-icon {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          background: #ffffff;
          color: #6c70d5;
        }

        .iq-answer {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          color: #697690;
          font-size: 7px;
          font-weight: 700;
        }

        .answer-sparkle {
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          background: #f3edff;
          color: #8b4ee4;
        }

        .platform-card-description {
          padding: 20px 28px 30px;
          color: #62718f;
          font-size: 14px;
          line-height: 1.65;
        }

        @media (max-width: 1150px) {
          .platform-grid {
            gap: 20px;
          }

          .platform-card-head h3 {
            font-size: 23px;
          }

          .platform-card-visual {
            height: 190px;
          }
        }

        @media (max-width: 900px) {
          .platform-inner {
            width: calc(100% - 48px);
          }

          .platform-grid {
            width: calc(100% - 48px);
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .platform-section {
            padding: 76px 0 68px;
          }

          .platform-title {
            font-size: 34px;
            letter-spacing: -1px;
          }

          .platform-description {
            font-size: 15.5px;
          }

          .platform-grid {
            width: calc(100% - 32px);
            margin-top: 48px;
          }

          .platform-card-visual {
            height: 170px;
          }

          .workflow-canvas {
            height: 112px;
          }

          .workflow-node {
            width: 92px;
            min-height: 33px;
          }

          .agent-node strong,
          .workflow-node strong,
          .agent-result strong {
            font-size: 9px;
          }

          .agent-node small,
          .workflow-node small,
          .agent-result small,
          .source-item,
          .iq-answer {
            font-size: 6.8px;
          }
        }




        /* ========================================================= */
        /* JASEIR AI AGENTS — FULL WORKSPACE                          */
        /* ========================================================= */

        .agentlab-intro {
          position: relative;
          min-height: 700px;
          overflow: hidden;
          background: #001e22;
          color: #fff;
        }

        .agentlab-intro-grid,
        .agentlab-workspace-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(57, 210, 214, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 210, 214, 0.055) 1px, transparent 1px);
          background-size: 74px 74px;
        }

        .agentlab-intro-glow {
          position: absolute;
          width: 900px;
          height: 700px;
          right: -220px;
          top: 40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 220, 220, .12), transparent 68%);
          filter: blur(30px);
          pointer-events: none;
        }

        .agentlab-intro-inner {
          position: relative;
          z-index: 2;
          width: min(1500px, calc(100% - 120px));
          min-height: 700px;
          margin: 0 auto;
          display: flex;
          align-items: center;
        }

        .agentlab-intro-copy {
          max-width: 900px;
          padding: 80px 0;
        }

        .agentlab-eyebrow,
        .agentlab-section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #11d5d8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .22em;
          text-transform: uppercase;
        }

        .agentlab-eyebrow {
          padding: 10px 17px;
          border: 1px solid rgba(17, 213, 216, .25);
          border-radius: 999px;
          background: rgba(17, 213, 216, .08);
        }

        .agentlab-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #14d5d7;
          box-shadow: 0 0 15px rgba(20, 213, 215, .8);
        }

        .agentlab-intro-title {
          margin: 34px 0 0;
          max-width: 900px;
          font-size: clamp(58px, 7vw, 102px);
          line-height: .94;
          letter-spacing: -5px;
          font-weight: 800;
        }

        .agentlab-intro-title span {
          color: #11d5d8;
        }

        .agentlab-intro-description {
          max-width: 820px;
          margin: 30px 0 0;
          color: rgba(232, 248, 249, .70);
          font-size: 20px;
          line-height: 1.65;
        }

        .agentlab-explore-button {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          margin-top: 35px;
          padding: 17px 25px;
          border-radius: 9px;
          background: #11ced2;
          color: #001a1d;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 15px 45px rgba(17, 206, 210, .15);
          transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
        }

        .agentlab-explore-button:hover {
          transform: translateY(-3px);
          background: #2be1e4;
          box-shadow: 0 20px 55px rgba(17, 206, 210, .25);
        }

        .agentlab-explore-button span {
          font-size: 20px;
          transition: transform .25s ease;
        }

        .agentlab-explore-button:hover span {
          transform: translateX(4px);
        }

        .agentlab-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          margin-top: 27px;
          color: rgba(225, 244, 245, .54);
          font-size: 13px;
        }

        .agentlab-proof span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .agentlab-proof b {
          color: #10d5d7;
        }

        /* FULL SECOND SECTION */
        .agentlab-workspace-section {
          position: relative;
          overflow: hidden;
          padding: 105px 0 125px;
          background: #001e22;
          color: #fff;
        }

        .agentlab-workspace-glow {
          position: absolute;
          left: 50%;
          top: 280px;
          width: 1000px;
          height: 700px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0, 220, 220, .10), transparent 68%);
          filter: blur(25px);
          pointer-events: none;
        }

        .agentlab-workspace-container {
          position: relative;
          z-index: 2;
          width: min(1450px, calc(100% - 100px));
          margin: 0 auto;
        }

        .agentlab-section-heading {
          max-width: 900px;
          margin-bottom: 55px;
        }

        .agentlab-section-eyebrow span {
          display: inline-block;
          width: 35px;
          height: 2px;
          background: #11d5d8;
        }

        .agentlab-section-heading h2 {
          margin: 25px 0 0;
          font-size: clamp(55px, 6vw, 88px);
          line-height: .94;
          letter-spacing: -4px;
          font-weight: 800;
        }

        .agentlab-section-heading h2 span {
          color: #11d5d8;
        }

        .agentlab-section-heading p {
          max-width: 800px;
          margin: 25px 0 0;
          color: rgba(229, 246, 247, .62);
          font-size: 18px;
          line-height: 1.7;
        }

        /* THE ONE LARGE BOX */
        .agentlab-box {
          position: relative;
          overflow: hidden;
          min-height: 700px;
          border: 1px solid #164f52;
          border-radius: 25px;
          background: #062a2d;
          box-shadow: 0 40px 120px rgba(0, 0, 0, .40);
        }

        .agentlab-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(48, 205, 210, .035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(48, 205, 210, .035) 1px, transparent 1px);
          background-size: 70px 70px;
          pointer-events: none;
        }

        .agentlab-box-topbar {
          position: relative;
          z-index: 2;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 25px;
          border-bottom: 1px solid #164a4d;
          background: rgba(7, 48, 51, .96);
        }

        .agentlab-window-dots {
          display: flex;
          gap: 7px;
        }

        .agentlab-window-dots i {
          display: block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #3d696b;
        }

        .agentlab-box-title {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          color: #a8c0c1;
          font-size: 13px;
          font-weight: 700;
        }

        .agentlab-live {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #13d6d8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .2em;
        }

        .agentlab-live i,
        .agentlab-agent-status i {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #13d6d8;
          box-shadow: 0 0 12px rgba(19, 214, 216, .85);
        }

        .agentlab-box-body {
          position: relative;
          z-index: 2;
          min-height: 630px;
          display: grid;
          grid-template-columns: 310px minmax(0, 1fr);
        }

        /* LEFT NAV IS INSIDE THE BOX */
        .agentlab-agent-nav {
          padding: 32px 20px;
          border-right: 1px solid #164a4d;
          background: rgba(4, 35, 38, .58);
        }

        .agentlab-agent-nav-label {
          margin: 0 12px 20px;
          color: #507b7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .24em;
        }

        .agentlab-agent-nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .agentlab-agent-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 13px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #719395;
          text-align: left;
          cursor: pointer;
          transition: all .3s ease;
        }

        .agentlab-agent-nav-item:hover {
          background: #0a383b;
          color: #d5e5e6;
        }

        .agentlab-agent-nav-item.active {
          border-color: #175b5e;
          background: #0b4144;
          color: #fff;
          box-shadow: inset 3px 0 0 #13d5d7;
        }

        .agentlab-agent-nav-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #1b5558;
          border-radius: 10px;
          background: #082f32;
          color: #6c9698;
        }

        .agentlab-agent-nav-item.active .agentlab-agent-nav-icon {
          border-color: #168c8f;
          background: #07383b;
          color: #13d5d7;
        }

        .agentlab-agent-nav-icon svg {
          width: 19px;
          height: 19px;
        }

        .agentlab-agent-nav-name {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
        }

        /* LARGE ACTIVE AGENT */
        .agentlab-agent-content {
          position: relative;
          padding: 46px 52px 48px;
          animation: agentlab-fade-in .45s ease;
        }

        @keyframes agentlab-fade-in {
          from {
            opacity: .35;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .agentlab-agent-content-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .agentlab-agent-category {
          color: #12d5d7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .27em;
        }

        .agentlab-agent-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #61888a;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .agentlab-agent-icon-large {
          width: 65px;
          height: 65px;
          margin-top: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #1a6467;
          border-radius: 15px;
          background: #09393c;
          color: #13d5d7;
          box-shadow: 0 0 40px rgba(19, 213, 215, .08);
        }

        .agentlab-agent-icon-large svg {
          width: 28px;
          height: 28px;
        }

        .agentlab-agent-content h3 {
          max-width: 900px;
          margin: 25px 0 0;
          color: #f6ffff;
          font-size: clamp(35px, 4vw, 57px);
          line-height: 1.02;
          letter-spacing: -2.8px;
          font-weight: 750;
        }

        .agentlab-agent-description {
          max-width: 850px;
          margin: 22px 0 0;
          color: #8eabad;
          font-size: 16px;
          line-height: 1.75;
        }

        .agentlab-agent-divider {
          height: 1px;
          margin: 35px 0 20px;
          background: #174b4e;
        }

        .agentlab-agent-steps {
          max-width: 850px;
        }

        .agentlab-step {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) 30px;
          align-items: center;
          min-height: 62px;
          border-bottom: 1px solid #123f42;
          color: #b7caca;
        }

        .agentlab-step-number {
          color: #4c7779;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .agentlab-step-name {
          font-size: 13px;
          font-weight: 700;
        }

        .agentlab-step-check {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #087e81;
          border-radius: 50%;
          background: #083b3e;
          color: #12d5d7;
          font-size: 11px;
        }

        .agentlab-open-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 35px;
          padding: 14px 18px;
          border: 1px solid #126d70;
          border-radius: 9px;
          background: #093d40;
          color: #c9e8e9;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all .25s ease;
        }

        .agentlab-open-button:hover {
          border-color: #13d5d7;
          background: #0b5053;
          color: #fff;
          transform: translateY(-2px);
        }

        .agentlab-open-button span {
          color: #13d5d7;
          font-size: 17px;
        }

        /* Floating notification INSIDE the workspace */
        .agentlab-insight {
          position: absolute;
          right: 30px;
          bottom: 30px;
          z-index: 5;
          width: 290px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px;
          border: 1px solid #195d60;
          border-radius: 12px;
          background: rgba(4, 42, 45, .96);
          box-shadow: 0 20px 50px rgba(0, 0, 0, .35);
          backdrop-filter: blur(12px);
        }

        .agentlab-insight-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #0a4649;
          color: #13d5d7;
        }

        .agentlab-insight-icon svg {
          width: 19px;
          height: 19px;
        }

        .agentlab-insight div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }

        .agentlab-insight span {
          display: block;
          color: #557e80;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .22em;
        }

        .agentlab-insight strong {
          display: block;
          margin-top: 4px;
          color: #e5f5f6;
          font-size: 12px;
          line-height: 1.3;
        }

        .agentlab-insight > b {
          color: #13d5d7;
          font-size: 18px;
        }

        .agentlab-selector {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: 22px;
        }

        .agentlab-selector button {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #355d60;
          cursor: pointer;
          transition: all .3s ease;
        }

        .agentlab-selector button.active {
          width: 30px;
          background: #13d5d7;
          box-shadow: 0 0 14px rgba(19, 213, 215, .35);
        }

        @media (max-width: 1050px) {
          .agentlab-intro-inner,
          .agentlab-workspace-container {
            width: min(100% - 50px, 900px);
          }

          .agentlab-intro-title {
            font-size: clamp(55px, 8vw, 78px);
          }

          .agentlab-box-body {
            grid-template-columns: 240px minmax(0, 1fr);
          }

          .agentlab-agent-content {
            padding: 38px 32px 45px;
          }
        }

        @media (max-width: 760px) {
          .agentlab-intro {
            min-height: auto;
          }

          .agentlab-intro-inner {
            min-height: auto;
            width: calc(100% - 36px);
          }

          .agentlab-intro-copy {
            padding: 85px 0 90px;
          }

          .agentlab-intro-title {
            font-size: clamp(48px, 14vw, 68px);
            letter-spacing: -3px;
          }

          .agentlab-intro-description {
            font-size: 16px;
            line-height: 1.6;
          }

          .agentlab-proof {
            gap: 12px 20px;
          }

          .agentlab-workspace-section {
            padding: 80px 0 90px;
          }

          .agentlab-workspace-container {
            width: calc(100% - 28px);
          }

          .agentlab-section-heading h2 {
            font-size: 48px;
            letter-spacing: -2.5px;
          }

          .agentlab-section-heading p {
            font-size: 16px;
          }

          .agentlab-box {
            border-radius: 18px;
          }

          .agentlab-box-title {
            font-size: 10px;
            white-space: nowrap;
          }

          .agentlab-box-body {
            display: block;
          }

          .agentlab-agent-nav {
            border-right: 0;
            border-bottom: 1px solid #164a4d;
            padding: 20px 14px;
          }

          .agentlab-agent-nav-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .agentlab-agent-nav-item {
            min-height: 68px;
            padding: 10px;
          }

          .agentlab-agent-nav-icon {
            width: 34px;
            height: 34px;
            flex-basis: 34px;
          }

          .agentlab-agent-nav-name {
            font-size: 11px;
          }

          .agentlab-agent-content {
            min-height: 560px;
            padding: 30px 22px 120px;
          }

          .agentlab-agent-icon-large {
            margin-top: 30px;
          }

          .agentlab-agent-content h3 {
            font-size: 37px;
            letter-spacing: -2px;
          }

          .agentlab-agent-description {
            font-size: 14px;
          }

          .agentlab-insight {
            right: 15px;
            bottom: 15px;
            width: calc(100% - 30px);
          }
        }

        /* ========================================================= */
        /* AGENT WORKSPACE — READABILITY + RICH PREVIEW OVERRIDES      */
        /* ========================================================= */

        .agentlab-workspace-section {
          background:
            radial-gradient(circle at 50% 30%, rgba(16, 214, 218, .06), transparent 34%),
            #001c20;
        }

        .agentlab-section-heading h2 {
          color: #f4ffff;
          text-shadow: 0 1px 20px rgba(0, 0, 0, .18);
        }

        .agentlab-section-heading p {
          color: #a9c2c4;
          max-width: 880px;
        }

        .agentlab-box {
          min-height: 760px;
          background: #062e32;
          border-color: #1c5b5e;
          box-shadow:
            0 40px 120px rgba(0, 0, 0, .42),
            inset 0 1px 0 rgba(255, 255, 255, .035);
        }

        .agentlab-box-topbar {
          height: 72px;
          background: #08373a;
          border-bottom-color: #1a5558;
        }

        .agentlab-box-title {
          color: #e7ffff;
          font-size: 13px;
          letter-spacing: .01em;
        }

        .agentlab-agent-nav {
          width: 285px;
          padding: 32px 22px;
          background: rgba(0, 20, 23, .30);
          border-right-color: #1a5558;
        }

        .agentlab-agent-nav-label {
          color: #6f999b;
          font-size: 9px;
          letter-spacing: .24em;
        }

        .agentlab-agent-nav-list {
          gap: 8px;
          margin-top: 18px;
        }

        .agentlab-agent-nav-item {
          min-height: 74px;
          padding: 12px;
          border: 1px solid transparent;
          color: #a9c2c4;
          background: transparent;
        }

        .agentlab-agent-nav-item:hover {
          border-color: #1a5558;
          background: #08373a;
          color: #eaffff;
        }

        .agentlab-agent-nav-item.active {
          border-color: #176b6e;
          background: #0b474a;
          color: #f3ffff;
          box-shadow:
            inset 3px 0 0 #13d9dc,
            0 10px 25px rgba(0, 0, 0, .12);
        }

        .agentlab-agent-nav-icon {
          width: 44px;
          height: 44px;
          flex-basis: 44px;
          border-color: #235e61;
          background: #083337;
          color: #79a2a4;
        }

        .agentlab-agent-nav-item.active .agentlab-agent-nav-icon {
          border-color: #14979a;
          background: #073d40;
          color: #16dfe2;
        }

        .agentlab-agent-nav-name {
          color: inherit;
          font-size: 13px;
          line-height: 1.35;
        }

        .agentlab-agent-content {
          min-width: 0;
          padding: 42px 50px 52px;
          background:
            linear-gradient(90deg, rgba(11, 72, 75, .08), transparent 42%);
        }

        .agentlab-agent-category {
          color: #18e0e2;
          font-size: 10px;
          letter-spacing: .28em;
        }

        .agentlab-agent-status {
          color: #789c9e;
        }

        .agentlab-agent-icon-large {
          width: 72px;
          height: 72px;
          margin-top: 32px;
          border-color: #23676a;
          background: #0a3b3e;
          color: #18e0e2;
          box-shadow:
            0 0 45px rgba(19, 213, 215, .10),
            inset 0 1px 0 rgba(255, 255, 255, .04);
        }

        .agentlab-agent-content h3 {
          margin-top: 22px;
          color: #ffffff;
          font-size: clamp(40px, 4vw, 62px);
          line-height: 1.02;
          letter-spacing: -2.9px;
          text-shadow: 0 2px 25px rgba(0, 0, 0, .22);
        }

        .agentlab-agent-description {
          max-width: 900px;
          margin-top: 20px;
          color: #b7ced0;
          font-size: 17px;
          line-height: 1.7;
        }

        .agentlab-agent-divider {
          margin: 28px 0 6px;
          background: #1b5356;
        }

        .agentlab-step {
          min-height: 58px;
          border-bottom-color: #15474a;
          color: #c4d8d9;
        }

        .agentlab-step-number {
          color: #679294;
          font-size: 9px;
        }

        .agentlab-step-name {
          color: #d7e7e8;
          font-size: 13px;
        }

        .agentlab-step-check {
          border-color: #15868a;
          background: #0a4144;
          color: #16dfe2;
        }

        /* Rich preview panel inside the same workspace box */
        .agentlab-preview {
          margin-top: 24px;
          padding: 17px;
          border: 1px solid #19575a;
          border-radius: 13px;
          background:
            linear-gradient(145deg, rgba(10, 61, 65, .92), rgba(5, 43, 46, .88));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .025),
            0 15px 35px rgba(0, 0, 0, .12);
        }

        .agentlab-preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 15px;
        }

        .agentlab-preview-head > div {
          display: grid;
          gap: 4px;
        }

        .agentlab-preview-head span:first-child {
          color: #18dfe2;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .20em;
        }

        .agentlab-preview-head strong {
          color: #e9ffff;
          font-size: 12px;
          font-weight: 750;
        }

        .agentlab-preview-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8eb4b6;
          font-size: 9px;
          font-weight: 750;
        }

        .agentlab-preview-live i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #17dcde;
          box-shadow: 0 0 10px rgba(23, 220, 222, .8);
        }

        .agentlab-preview-flow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr) 22px minmax(0, 1fr);
          align-items: stretch;
          gap: 7px;
        }

        .agentlab-preview-card {
          min-width: 0;
          min-height: 83px;
          padding: 12px;
          border: 1px solid #1a5154;
          border-radius: 9px;
          background: rgba(3, 31, 34, .55);
        }

        .agentlab-preview-card.active {
          border-color: #157f82;
          background: rgba(10, 74, 77, .58);
          box-shadow: inset 0 0 0 1px rgba(19, 216, 218, .05);
        }

        .agentlab-preview-index {
          display: block;
          margin-bottom: 8px;
          color: #668d8f;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .agentlab-preview-card.active .agentlab-preview-index {
          color: #18dfe2;
        }

        .agentlab-preview-card strong {
          display: block;
          color: #d9eded;
          font-size: 11px;
          line-height: 1.35;
        }

        .agentlab-preview-card small {
          display: block;
          margin-top: 5px;
          color: #73999b;
          font-size: 8px;
        }

        .agentlab-preview-arrow {
          align-self: center;
          color: #18cfd2;
          font-size: 15px;
          text-align: center;
        }

        .agentlab-preview-bottom {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 25px;
          margin-top: 14px;
          padding-top: 13px;
          border-top: 1px solid #15484b;
        }

        .agentlab-metrics {
          display: flex;
          gap: 25px;
        }

        .agentlab-metrics div {
          display: grid;
          gap: 3px;
        }

        .agentlab-metrics span,
        .agentlab-tools > span {
          color: #648b8d;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .14em;
        }

        .agentlab-metrics strong {
          color: #dff4f4;
          font-size: 13px;
        }

        .agentlab-tools {
          display: grid;
          gap: 6px;
          text-align: right;
        }

        .agentlab-tools > div {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 5px;
        }

        .agentlab-tools b {
          padding: 4px 7px;
          border: 1px solid #1b5b5e;
          border-radius: 999px;
          background: #08383b;
          color: #9fc1c2;
          font-size: 7px;
          font-weight: 750;
        }

        .agentlab-open-button {
          margin-top: 24px;
          padding: 14px 20px;
          border-color: #167b7e;
          background: #0a484b;
          color: #e0f7f7;
          font-size: 12px;
        }

        .agentlab-open-button:hover {
          border-color: #18dfe2;
          background: #0c575a;
          box-shadow: 0 12px 30px rgba(0, 0, 0, .16);
        }

        .agentlab-insight {
          right: 28px;
          bottom: 27px;
          width: 300px;
          border-color: #216164;
          background: rgba(4, 45, 48, .98);
        }

        .agentlab-insight span {
          color: #6d9698;
        }

        .agentlab-insight strong {
          color: #f0ffff;
          font-size: 12px;
        }

        @media (max-width: 1050px) {
          .agentlab-agent-nav {
            width: 240px;
          }

          .agentlab-agent-content {
            padding: 36px 30px 145px;
          }

          .agentlab-preview-flow {
            grid-template-columns: 1fr;
          }

          .agentlab-preview-arrow {
            transform: rotate(90deg);
          }

          .agentlab-preview-bottom {
            grid-template-columns: 1fr;
          }

          .agentlab-tools {
            text-align: left;
          }

          .agentlab-tools > div {
            justify-content: flex-start;
          }
        }

        @media (max-width: 760px) {
          .agentlab-box {
            min-height: 0;
          }

          .agentlab-agent-nav {
            width: 100%;
          }

          .agentlab-agent-content {
            padding: 30px 20px 135px;
          }

          .agentlab-agent-content h3 {
            font-size: 38px;
            letter-spacing: -2px;
          }

          .agentlab-agent-description {
            font-size: 15px;
          }

          .agentlab-preview {
            padding: 14px;
          }

          .agentlab-preview-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .agentlab-metrics {
            gap: 15px;
          }

          .agentlab-insight {
            right: 14px;
            bottom: 14px;
            width: calc(100% - 28px);
          }
        }

        /* ========================================================= */
        /* AI AGENTS — AGENTLAB STYLE                                  */
        /* ========================================================= */
        .agents-section {
          position: relative;
          overflow: hidden;
          min-height: 720px;
          padding: 105px 0 110px;
          background:
            radial-gradient(circle at 78% 48%, rgba(0, 214, 214, 0.13), transparent 28%),
            linear-gradient(135deg, #001e22 0%, #00292d 52%, #00191d 100%);
          color: #fff;
        }

        .agents-section::before {
          content: "";
          position: absolute;
          width: 900px;
          height: 900px;
          right: -250px;
          top: -420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 221, 221, .10), transparent 62%);
          pointer-events: none;
        }

        .agents-section::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(65, 205, 210, .035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(65, 205, 210, .035) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: linear-gradient(90deg, transparent, #000 30%, #000 100%);
          pointer-events: none;
        }

        .agents-inner {
          position: relative;
          z-index: 2;
          width: min(1450px, calc(100% - 100px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 48% 52%;
          align-items: center;
          gap: 55px;
        }

        .agents-copy {
          max-width: 700px;
        }

        .agents-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 15px;
          margin-bottom: 28px;
          border: 1px solid rgba(0, 222, 222, .18);
          border-radius: 999px;
          background: rgba(0, 214, 214, .12);
          color: #11d5d5;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .2px;
        }

        .agents-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #12dada;
          box-shadow: 0 0 14px rgba(18, 218, 218, .8);
        }

        .agents-title {
          margin: 0;
          max-width: 760px;
          font-size: clamp(52px, 5.4vw, 82px);
          line-height: .98;
          letter-spacing: -4px;
          font-weight: 800;
          color: #f7ffff;
        }

        .agents-title-accent {
          color: #10d8d8;
        }

        .agents-description {
          max-width: 690px;
          margin: 27px 0 0;
          color: rgba(236, 249, 250, .72);
          font-size: 19px;
          line-height: 1.65;
        }

        .agents-cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 32px;
        }

        .agents-cta {
          height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 24px;
          border-radius: 9px;
          background: #08c9ca;
          color: #00181b;
          font-size: 15px;
          font-weight: 800;
          transition: transform .2s ease, box-shadow .2s ease;
          box-shadow: 0 14px 35px rgba(0, 201, 202, .15);
        }

        .agents-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(0, 201, 202, .25);
        }

        .agents-proof {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 28px;
          color: rgba(236, 249, 250, .58);
          font-size: 13px;
        }

        .agents-proof span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .agents-proof b {
          color: #0bd2d2;
        }

        .agent-stage {
          position: relative;
          min-height: 510px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-stage-glow {
          position: absolute;
          width: 560px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0, 222, 222, .12), transparent 67%);
          filter: blur(12px);
        }

        .agent-stage-orbit {
          position: absolute;
          width: 610px;
          height: 610px;
          border: 1px solid rgba(68, 220, 220, .09);
          border-radius: 50%;
          transform: rotate(-17deg);
        }

        .agent-stage-orbit::before,
        .agent-stage-orbit::after {
          content: "";
          position: absolute;
          inset: 60px;
          border: 1px solid rgba(68, 220, 220, .07);
          border-radius: 50%;
        }

        .agent-stage-orbit::after { inset: 145px; }

        .agent-workspace {
          position: relative;
          z-index: 5;
          width: min(610px, 100%);
          min-height: 430px;
          border: 1px solid rgba(120, 231, 231, .22);
          border-radius: 12px;
          background: rgba(7, 44, 48, .92);
          box-shadow: 0 35px 90px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255,255,255,.04);
          backdrop-filter: blur(16px);
          overflow: hidden;
          animation: agentWorkspaceFloat 5s ease-in-out infinite;
        }

        .agent-workspace-top {
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          border-bottom: 1px solid rgba(160, 235, 235, .10);
          background: rgba(255,255,255,.025);
        }

        .agent-window-dots { display: flex; gap: 6px; }
        .agent-window-dots i { width: 7px; height: 7px; border-radius: 50%; background: rgba(180,240,240,.25); }

        .agent-workspace-name {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(236, 255, 255, .82);
          font-size: 12px;
          font-weight: 700;
        }

        .agent-live {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #12d9d9;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .agent-live i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #12d9d9;
          box-shadow: 0 0 10px rgba(18, 217, 217, .8);
          animation: agentPulse 1.6s ease-in-out infinite;
        }

        .agent-workspace-body {
          display: grid;
          grid-template-columns: 1fr 150px;
          min-height: 370px;
        }

        .agent-main {
          padding: 28px;
        }

        .agent-mini-label {
          color: rgba(16, 215, 215, .75);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .agent-main h3 {
          margin: 12px 0 10px;
          color: #f1ffff;
          font-size: 30px;
          line-height: 1.05;
          letter-spacing: -1.3px;
        }

        .agent-main p {
          margin: 0;
          max-width: 400px;
          color: rgba(227, 247, 248, .62);
          font-size: 13px;
          line-height: 1.7;
        }

        .agent-progress {
          display: grid;
          gap: 9px;
          margin-top: 25px;
        }

        .agent-progress-row {
          display: grid;
          grid-template-columns: 20px 1fr 18px;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid rgba(130, 220, 220, .08);
          border-radius: 7px;
          background: rgba(255,255,255,.025);
        }

        .agent-progress-num {
          color: rgba(145, 235, 235, .45);
          font-size: 8px;
          font-weight: 800;
        }

        .agent-progress-text {
          color: rgba(235, 253, 253, .82);
          font-size: 11px;
          font-weight: 700;
        }

        .agent-progress-check {
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(10, 212, 212, .14);
          color: #12d9d9;
          font-size: 10px;
        }

        .agent-sidebar {
          padding: 23px 17px;
          border-left: 1px solid rgba(160, 235, 235, .09);
          background: rgba(0,0,0,.10);
        }

        .agent-sidebar-label {
          color: rgba(222, 247, 247, .45);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .agent-sidebar-list {
          display: grid;
          gap: 10px;
          margin-top: 15px;
        }

        .agent-sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 7px;
          border-radius: 7px;
          color: rgba(225, 247, 247, .64);
          font-size: 9px;
          font-weight: 650;
        }

        .agent-sidebar-item.active {
          color: #eaffff;
          background: rgba(0, 216, 216, .09);
        }

        .agent-sidebar-icon {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          background: rgba(0, 216, 216, .10);
          color: #11d7d7;
        }

        .agent-insight {
          position: absolute;
          right: -24px;
          bottom: 32px;
          z-index: 10;
          width: 230px;
          padding: 15px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(115, 232, 232, .20);
          border-radius: 9px;
          background: rgba(7, 44, 48, .96);
          box-shadow: 0 20px 50px rgba(0,0,0,.30);
          animation: agentInsightFloat 4s ease-in-out infinite;
        }

        .agent-insight-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 9px;
          background: rgba(0, 216, 216, .10);
          color: #11d9d9;
        }

        .agent-insight span {
          display: block;
          color: rgba(205, 243, 243, .42);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .agent-insight strong {
          display: block;
          margin-top: 4px;
          color: #efffff;
          font-size: 11px;
        }

        .agent-insight b {
          margin-left: auto;
          color: #12d9d9;
          font-size: 17px;
        }

        .agent-selector {
          position: absolute;
          left: 0;
          bottom: 0;
          display: flex;
          gap: 7px;
          z-index: 8;
        }

        .agent-selector-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,.20);
          transition: all .3s ease;
        }

        .agent-selector-dot.active { width: 24px; border-radius: 10px; background: #10d8d8; }

        @keyframes agentWorkspaceFloat {
          0%,100% { transform: translateY(0) rotate(.15deg); }
          50% { transform: translateY(-7px) rotate(-.15deg); }
        }
        @keyframes agentInsightFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
        @keyframes agentPulse {
          0%,100% { opacity: .5; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        @media (max-width: 1150px) {
          .agents-inner { width: min(1100px, calc(100% - 48px)); grid-template-columns: 45% 55%; gap: 25px; }
          .agents-title { font-size: 58px; letter-spacing: -3px; }
          .agent-stage { transform: scale(.92); transform-origin: center right; }
        }

        @media (max-width: 900px) {
          .agents-section { padding: 85px 0 90px; }
          .agents-inner { width: calc(100% - 48px); grid-template-columns: 1fr; }
          .agents-copy { text-align: center; max-width: 760px; margin: 0 auto; }
          .agents-eyebrow, .agents-cta-row, .agents-proof { justify-content: center; }
          .agents-title { font-size: clamp(48px, 10vw, 68px); }
          .agent-stage { min-height: 470px; transform: none; }
          .agent-insight { right: 5px; }
        }

        @media (max-width: 620px) {
          .agents-inner { width: calc(100% - 32px); }
          .agents-title { font-size: 43px; letter-spacing: -2px; }
          .agents-description { font-size: 16px; }
          .agents-proof { flex-wrap: wrap; }
          .agent-stage { min-height: 390px; }
          .agent-workspace { min-height: 340px; }
          .agent-workspace-body { grid-template-columns: 1fr; }
          .agent-sidebar { display: none; }
          .agent-main { padding: 22px; }
          .agent-main h3 { font-size: 25px; }
          .agent-insight { right: 0; bottom: 8px; width: 205px; }
          .agent-stage-orbit { width: 430px; height: 430px; }
          .agents-cta-row { flex-direction: column; }
        }


        /* The redesigned AgentLab workspace is the primary agents presentation. */
        .agents-section {
          display: none;
        }

        /* ========================================================= */
        /* RESPONSIVE                                                   */
        /* ========================================================= */

        @media (max-width: 1150px) {
          .nav-inner,
          .hero {
            width:
              min(
                calc(100% - 48px),
                1100px
              );
          }

          .nav-links {
            gap: 22px;
            margin-left: 30px;
          }

          .hero {
            grid-template-columns:
              42% 58%;
          }

          .hero-title {
            font-size: 58px;
            letter-spacing: -3px;
          }

          .visual-wrap {
            transform: scale(0.9);

            transform-origin: center;
          }
        }

        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }

          .hero {
            grid-template-columns: 1fr;

            padding-top: 70px;
          }

          .hero-copy {
            padding-right: 0;

            text-align: center;
          }

          .eyebrow,
          .hero-buttons,
          .benefits {
            justify-content: center;
          }

          .hero-title,
          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }

          .visual-wrap {
            height: 600px;

            transform: scale(0.82);

            margin-top: -50px;
          }
        }

        @media (max-width: 900px) {
          .trusted-section {
            padding: 30px 0;
          }

          .trusted-marquee {
            width: calc(100% - 32px);
          }

          .trusted-track {
            gap: 44px;
          }
        }


        @media (max-width: 1150px) {
          .how-inner {
            grid-template-columns: 46% 54%;
            gap: 18px;
          }

          .how-title {
            font-size: 58px;
            letter-spacing: -3px;
          }

          .architecture-stage {
            transform: scale(0.94);
            transform-origin: center right;
          }

          .architecture-label-title {
            font-size: 15px;
          }
        }

        @media (max-width: 900px) {
          .how-section {
            padding: 88px 0 78px;
          }

          .how-inner {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .how-copy {
            padding-right: 0;
          }

          .how-title {
            max-width: 680px;
            font-size: clamp(50px, 10vw, 68px);
          }

          .how-description {
            max-width: 680px;
          }

          .how-architecture {
            min-height: 560px;
          }

          .architecture-stage {
            transform: none;
          }
        }

        @media (max-width: 620px) {
          .nav-inner,
          .hero {
            width:
              calc(100% - 32px);
          }

          .signin {
            display: none;
          }

          .hero-title {
            font-size: 48px;

            letter-spacing: -2.7px;
          }

          .hero-description {
            font-size: 16px;
          }

          .benefits {
            flex-wrap: wrap;
          }

          .visual-wrap {
            height: 520px;

            transform: scale(0.62);

            margin-left: -18%;
            margin-right: -18%;

            margin-top: -80px;
          }

          .how-section {
            padding: 72px 0 64px;
          }

          .how-inner {
            width: calc(100% - 32px);
          }

          .how-title {
            font-size: 46px;
            letter-spacing: -2.5px;
          }

          .how-description {
            font-size: 16px;
          }

          .how-steps {
            gap: 16px;
          }

          .how-step {
            grid-template-columns: 38px 40px 1fr;
            gap: 11px;
          }

          .how-number {
            width: 38px;
            height: 38px;
          }

          .how-step-icon {
            width: 40px;
            height: 40px;
          }

          .how-step-title {
            font-size: 14px;
          }

          .how-step-description {
            font-size: 12px;
          }

          .how-architecture {
            min-height: 560px;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
          }

          .how-architecture::-webkit-scrollbar {
            display: none;
          }

          .architecture-stage {
            min-width: 820px;
            height: 560px;
            transform: scale(0.88);
            transform-origin: left center;
          }

          .impact-strip {
            width: calc(100% - 32px);
            grid-template-columns: 1fr;
            gap: 0;
            padding: 8px 18px;
          }

          .impact-metric {
            padding: 16px 10px;
          }

          .impact-metric + .impact-metric {
            border-left: 0;
            border-top: 1px solid rgba(216,224,239,0.95);
          }

          .trusted-track {
            gap: 34px;
          }

          .trusted-logo {
            font-size: 16px;
          }
        }
      `}</style>

      {/* ============================================================ */}
      {/* HEADER                                                        */}
      {/* ============================================================ */}

      <header className="nav">
  <div className="nav-inner">
    <a
      href="https://www.jaseir.com/"
      className="logo"
    >
      JASEIR <span>AI</span>
    </a>

    <nav className="nav-links">
      <a
        href="https://www.jaseir.com/services/"
      >
        Services
      </a>

      <a href="#agent-workspace" className="nav-active">
  AI Agents
</a>

      <a href="#how-it-works">
        How It Works
      </a>

      <a
        href="https://www.jaseir.com/about/"
      >
        About
      </a>

      <a
        href="https://www.jaseir.com/contact/"
      >
        Contact
      </a>
    </nav>

    <div className="nav-actions">
      <a
        className="get-started"
        href="https://www.jaseir.com/contact/"
      >
        Get Started
        <span>→</span>
      </a>
    </div>
  </div>
</header>

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}

      <section className="hero">

        {/* ========================================================== */}
        {/* LEFT SIDE                                                   */}
        {/* ========================================================== */}

        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />

            THE NEXT ERA OF INTELLIGENCE
          </div>

          <h1 className="hero-title">
            AI that turns

            <span className="gradient-text">
              information
            </span>

            into action.
          </h1>

          <p className="hero-description">
            Intelligent systems that understand
            knowledge, context and patterns —
            transforming complex information
            into meaningful outcomes.
          </p>

          <div className="hero-buttons">
            <a
              className="primary-button"
              href="#agents"
            >
              Explore AI
              <span>→</span>
            </a>

            <a
              className="secondary-button"
              href="#how-it-works"
            >
              <span className="play">
                ▶
              </span>

              See how it works
            </a>
          </div>

          <div className="benefits">
            <div className="benefit">
              <span className="check">
                ✓
              </span>

              More knowledge
            </div>

            <div className="benefit">
              <span className="check">
                ✓
              </span>

              Deeper understanding
            </div>

            <div className="benefit">
              <span className="check">
                ✓
              </span>

              Real impact
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT AI VISUAL                                             */}
        {/* ========================================================== */}

        <div className="visual-wrap">
          <div className="ai-canvas">

            {/* BACKGROUND RINGS */}

            <div className="canvas-ring" />

            {/* AMBIENT DOTS */}

            <span className="ambient ambient-1" />
            <span className="ambient ambient-2" />
            <span className="ambient ambient-3" />

            {/* ====================================================== */}
            {/* SOURCE ANNOTATION                                      */}
            {/* ====================================================== */}

            <div className="annotation annotation-sources">
              Multiple sources
              <br />
              One intelligence
            </div>

            <svg
              className="annotation-svg"
              style={{
                left: "18%",
                top: "48px",
                width: "100px",
                height: "75px",
              }}
              viewBox="0 0 70 44"
            >
              <defs>
                <marker
                  id="arrow1"
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="4"
                  orient="auto"
                >
                  <path
                    d="M0,0 L8,4 L0,8 Z"
                    fill="#4c5ad0"
                  />
                </marker>
              </defs>

              <path
                d="
                  M5 5
                  C35 12,
                  64 34,
                  90 68
                "
                fill="none"
                stroke="#4c5ad0"
                strokeWidth="1.6"
                strokeLinecap="round"
                markerEnd="url(#arrow1)"
              />
            </svg>

            {/* ====================================================== */}
            {/* LOOP ANNOTATION                                        */}
            {/* ====================================================== */}

            <div className="annotation annotation-loop">
              A continuous
              <br />
              cycle of progress
            </div>

            <svg
              className="annotation-svg"
              style={{
                right: "4%",
                bottom: "78px",
                width: "110px",
                height: "72px",
              }}
              viewBox="0 0 100 80"
            >
              <defs>
                <marker
                  id="arrow2"
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="4"
                  orient="auto"
                >
                  <path
                    d="M0,0 L8,4 L0,8 Z"
                    fill="#b5399a"
                  />
                </marker>
              </defs>

              <path
                d="
                  M105 6
                  C80 10,
                  57 25,
                  42 42
                  C32 53,
                  24 62,
                  12 68
                "
                fill="none"
                stroke="#b5399a"
                strokeWidth="1.7"
                strokeLinecap="round"
                markerEnd="url(#arrow2)"
              />
            </svg>

            {/* ====================================================== */}
            {/* CONNECTION SYSTEM                                      */}
            {/* ====================================================== */}

            <svg
              ref={svgRef}
              className="network-svg"
              viewBox="0 0 800 650"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="softGlow">
                  <feGaussianBlur
                    stdDeviation="3"
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ==================================================== */}
              {/* INPUTS → CENTRAL                                      */}
              {/* ==================================================== */}

              <path
                id="path-text"
                className="connection connection-blue"
                d="
                  M220 153
                  C300 153,
                  315 210,
                  400 260
                "
              />

              <path
                id="path-data"
                className="connection connection-green"
                d="
                  M220 241
                  C300 241,
                  330 265,
                  400 292
                "
              />

              <path
                id="path-images"
                className="connection connection-pink"
                d="
                  M220 329
                  C300 329,
                  335 329,
                  400 325
                "
              />

              <path
                id="path-web"
                className="connection connection-purple"
                d="
                  M220 417
                  C300 417,
                  330 380,
                  400 350
                "
              />

              <path
                id="path-people"
                className="connection connection-orange"
                d="
                  M220 505
                  C300 505,
                  325 435,
                  400 378
                "
              />

              {/* ==================================================== */}
              {/* CENTRAL → KNOWLEDGE                                   */}
              {/* ==================================================== */}

              <path
                id="path-k1"
                className="connection connection-blue"
                d="
                  M505 245
                  C545 205,
                  555 160,
                  585 118
                "
              />

              <path
                id="path-k2"
                className="connection connection-purple"
                d="
                  M505 275
                  C555 240,
                  570 175,
                  610 130
                "
              />

              {/* ==================================================== */}
              {/* CENTRAL → MEANINGFUL OUTCOMES                        */}
              {/* ==================================================== */}

              <path
                id="path-o1"
                className="connection connection-blue"
                d="
                  M535 300
                  C575 300,
                  605 286,
                  642 286
                "
              />

              <path
                id="path-o2"
                className="connection connection-purple"
                d="
                  M535 325
                  C575 325,
                  610 320,
                  642 320
                "
              />

              <path
                id="path-o3"
                className="connection connection-pink"
                d="
                  M535 350
                  C575 350,
                  610 360,
                  642 360
                "
              />

              <path
                id="path-o4"
                className="connection connection-orange"
                d="
                  M535 375
                  C575 380,
                  610 400,
                  642 400
                "
              />

              {/* ==================================================== */}
              {/* CONTINUOUS INTELLIGENCE LOOP                         */}
              {/* ==================================================== */}

              <path
                id="path-loop"
                className="connection connection-out"
                d="
                  M450 505

                  C475 560,
                  545 605,
                  625 610

                  C705 615,
                  765 585,
                  775 530

                  C782 485,
                  748 452,
                  705 435

                  C680 425,
                  650 420,
                  625 418
                "
              />

              {/* ==================================================== */}
              {/* MOVING PARTICLES                                      */}
              {/* ==================================================== */}

              {dotPaths.map((p, i) => (
                <circle
                  key={`${p.id}-${i}`}
                  ref={(el) => {
                    circleRefs.current[i] = el;
                  }}
                  r={p.r ?? 4}
                  fill={p.color}
                  filter="url(#softGlow)"
                />
              ))}
            </svg>

            {/* ====================================================== */}
            {/* INPUT CARDS                                            */}
            {/* ====================================================== */}

            {inputCards.map(
              (item, index) => (
                <div
                  key={item.title}
                  className={`input-card input-${index + 1}`}
                >
                  <div
                    className={`mini-icon tone-${item.tone}`}
                  >
                    <Icon
                      name={item.icon}
                    />
                  </div>

                  <div>
                    <div className="input-title">
                      {item.title}
                    </div>

                    <div className="input-subtitle">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* ====================================================== */}
            {/* KNOWLEDGE PANEL                                        */}
            {/* ====================================================== */}

            <div className="context-panel">
              <div className="context-graph">

                <span
                  className="context-graph-line"
                  style={{
                    width: "30px",
                    left: "6px",
                    top: "26px",
                    transform:
                      "rotate(-26deg)",
                  }}
                />

                <span
                  className="context-graph-line"
                  style={{
                    width: "32px",
                    left: "28px",
                    top: "16px",
                    transform:
                      "rotate(24deg)",
                  }}
                />

                <span
                  className="context-graph-line"
                  style={{
                    width: "29px",
                    left: "29px",
                    top: "27px",
                    transform:
                      "rotate(-32deg)",
                  }}
                />

                <span
                  className="context-graph-dot"
                  style={{
                    left: "4px",
                    top: "24px",
                  }}
                />

                <span
                  className="context-graph-dot"
                  style={{
                    left: "26px",
                    top: "13px",
                  }}
                />

                <span
                  className="context-graph-dot"
                  style={{
                    left: "54px",
                    top: "27px",
                  }}
                />

                <span
                  className="context-graph-dot"
                  style={{
                    left: "32px",
                    top: "40px",
                  }}
                />
              </div>

              <div className="context-text">
                <span>
                  CONTEXT
                </span>

                <span>
                  PATTERNS
                </span>

                <span>
                  KNOWLEDGE
                </span>
              </div>

              <span className="status-dot" />
            </div>

            <div className="context-connector" />

            {/* ====================================================== */}
            {/* CENTRAL INTELLIGENCE STACK                             */}
            {/* ====================================================== */}

            <div className="brain">
              <div className="layer layer-1">
                UNDERSTAND
              </div>

              <div className="layer layer-2">
                REASON
              </div>

              <div className="layer layer-3">
                CREATE
              </div>

              <div className="layer layer-4">
                TAKE ACTION
              </div>

              <span className="core-dot" />
            </div>

            {/* ====================================================== */}
            {/* MEANINGFUL OUTCOMES                                    */}
            {/* ====================================================== */}

            <div className="outcomes-card">
              <div className="card-heading">
                Meaningful outcomes
              </div>

              <div className="outcome-list">
                {outcomes.map(
                  (item) => (
                    <div
                      className="outcome"
                      key={item.label}
                    >
                      <span
                        className={`outcome-icon tone-${item.tone}`}
                      >
                        <Icon
                          name={item.icon}
                        />
                      </span>

                      {item.label}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ====================================================== */}
            {/* LOOP LABELS                                            */}
            {/* ====================================================== */}

            <div className="loop-label learn">
              LEARN
            </div>

            <div className="loop-label improve">
              IMPROVE
            </div>

            <div className="loop-label evolve">
              EVOLVE
            </div>
          </div>
        </div>
      </section>


      {/* ============================================================ */}
      {/* AI AGENTS — AGENTLAB STYLE SHOWCASE                           */}
      {/* ============================================================ */}
      <AgentsShowcaseSection />


      {/* ============================================================ */}
      {/* PLATFORM (Jasper-style 3-column feature grid, dynamic icons) */}
      {/* ============================================================ */}

      <section className="platform-section" id="how-it-works">
        <div className="platform-inner">
          <div className="platform-eyebrow">
            The Jaseir Platform
          </div>

          <h2 className="platform-title">
            The platform for{" "}
            <span className="gradient-text">
              intelligent action
            </span>
          </h2>

          <p className="platform-description">
            Jaseir is the AI workspace built for modern teams. With
            specialized agents and connected workflows — structured,
            end-to-end pipelines that turn information into outcomes —
            Jaseir transforms complexity into clarity, strengthening
            control and driving measurable results across every part
            of your business.
          </p>

          <a
            className="platform-cta"
            href="#agents"
          >
            Explore The Platform
          </a>
        </div>

        <div className="platform-grid">
          {platformCards.map((card) => (
            <div
              key={card.key}
              className={`platform-card platform-card-${card.key}`}
            >
              <div className="platform-card-head">
                <h3>{card.title}</h3>
              </div>

              <div className="platform-card-visual">
                {card.type === "agent" && <AgentVisual />}
                {card.type === "workflow" && <WorkflowVisual />}
                {card.type === "iq" && <IQVisual />}
              </div>

              <p className="platform-card-description">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ============================================================ */}
      {/* JASEIR SERVICES — JASPER-STYLE EDITORIAL SHOWCASE           */}
      {/* ============================================================ */}

      <JaseirServicesSection />


      {/* ============================================================ */}
      {/* TRUSTED BY INNOVATIVE TEAMS (centered, auto-scrolling)       */}
      {/* ============================================================ */}

      <section className="trusted-section" aria-label="Trusted by innovative teams">
        <div className="trusted-heading">
          Trusted by innovative teams
        </div>

        <div className="trusted-marquee">
          <div className="trusted-track">
            {trustedLogos.map((logo) => (
              <div className="trusted-logo" key={`a-${logo.key}`}>
                {logo.node}
                {logo.label && <span>{logo.label}</span>}
              </div>
            ))}

            {trustedLogos.map((logo) => (
              <div className="trusted-logo" key={`b-${logo.key}`} aria-hidden="true">
                {logo.node}
                {logo.label && <span>{logo.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}