/* ------------------------------------------------------------------ */
/* BUILD STATIC KIT — renders the shared header, footer and related-   */
/* agents strip to plain HTML for apps that aren't React (the Flask    */
/* booking agent). Called by sync-shared.mjs; prints JSON to stdout:   */
/*   { "<relative path>": "<file contents>", ... }                     */
/*                                                                     */
/*   npx tsx scripts/build-static-kit.tsx booking-agent                */
/* ------------------------------------------------------------------ */

import { renderToStaticMarkup } from "react-dom/server";
import { RelatedAgents } from "../components/agent/AgentTemplate";
import SiteFooter, { type FooterCta } from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import { agentVars, getAgent, type AgentSlug } from "../lib/agents";
import type { SiteZone } from "../lib/site";

/** Footer CTA copy for each static app. */
const ctas: Partial<Record<AgentSlug, FooterCta>> = {
  "booking-agent": {
    title: "Want this booking agent on your website?",
    text: "We connect it to your real calendar, train it on your services and FAQs, and send every booking and lead straight to your CRM.",
  },
};

const slug = process.argv[2] as AgentSlug;
const agent = getAgent(slug);
const zone: SiteZone = { kind: "agent", slug };

const vars = Object.entries(agentVars(agent))
  .map(([k, v]) => `  ${k}: ${v};`)
  .join("\n");

const files: Record<string, string> = {
  "templates/partials/site_header.html": renderToStaticMarkup(<SiteHeader zone={zone} />),
  "templates/partials/site_footer.html": renderToStaticMarkup(<SiteFooter zone={zone} cta={ctas[slug]} />),
  "templates/partials/related_agents.html": renderToStaticMarkup(<RelatedAgents slug={slug} zone={zone} />),
  "templates/partials/agent_vars.html": `<style>\n:root {\n${vars}\n  --font-geist-sans: "Geist";\n  --font-geist-mono: "Geist Mono";\n}\n</style>`,
};

process.stdout.write(JSON.stringify(files));
