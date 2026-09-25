/* ------------------------------------------------------------------ */
/* SITE HEADER — shared by the home page and service pages             */
/* ------------------------------------------------------------------ */

const navItems = [
  { id: "services", label: "Services", href: "https://www.jaseir.com/" },
  { id: "agents", label: "AI Agents", href: "/#agent-workspace" },
  { id: "rag", label: "RAG AI", href: "/rag-knowledge-assistant/" },
  { id: "how", label: "How It Works", href: "/#how-it-works" },
  { id: "about", label: "About", href: "https://www.jaseir.com/about/" },
  { id: "contact", label: "Contact", href: "https://www.jaseir.com/contact/" },
];

export default function SiteHeader({
  active,
  theme = "light",
}: {
  active?: string;
  /** "dark" = dark bar with the white logo (used on dark pages). */
  theme?: "light" | "dark";
}) {
  return (
    <header className={theme === "dark" ? "nav nav-dark" : "nav"}>
      <div className="nav-inner">
        <a href="https://www.jaseir.com/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "dark" ? "/logo-light.webp" : "/logo.webp"}
            alt="Jaseir"
            className="jaseir-logo"
          />
        </a>

        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={item.id === active ? "nav-active" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="get-started" href="https://www.jaseir.com/contact/">
            Get Started
            <span>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
