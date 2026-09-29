#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/* SYNC SHARED KIT — copies the Jaseir site kit from dashboard/ into   */
/* each agent app.                                                     */
/*                                                                     */
/*   node scripts/sync-shared.mjs              sync every target       */
/*   node scripts/sync-shared.mjs ai-lead-qualification   one target   */
/*   node scripts/sync-shared.mjs --check      report drift, no writes */
/*                                                                     */
/* Next.js apps get the React kit (KIT_FILES). The Flask booking agent */
/* gets static HTML partials rendered from the same React components   */
/* (scripts/build-static-kit.tsx), plus the kit CSS and a small JS     */
/* file for the header menus.                                          */
/*                                                                     */
/* Safe to re-run: it only ever writes kit files, and it refuses to    */
/* overwrite a file that exists in the target but does not carry the   */
/* GENERATED marker (i.e. app-specific code).                          */
/* ------------------------------------------------------------------ */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DASHBOARD = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HUB = resolve(DASHBOARD, "..");

/** React kit files for Next.js apps, relative to the dashboard root. */
const KIT_FILES = [
  "lib/agents.ts",
  "lib/site.ts",
  "lib/agent-metadata.ts",
  "components/layout/SiteHeader.tsx",
  "components/layout/SiteFooter.tsx",
  "components/layout/CurrentYear.tsx",
  "components/agent/AgentIcon.tsx",
  "components/agent/AgentTemplate.tsx",
  "components/agent/AgentUi.tsx",
  "styles/jaseir-kit.css",
];

/**
 * Target apps.
 * - next:  `root` is the folder that contains app/ ("src" for src/ layouts).
 * - flask: `slug` is the agent in lib/agents.ts the static partials are for.
 */
const TARGETS = [
  { app: "ai-lead-qualification", kind: "next", root: "." },
  { app: "ai-planner", kind: "next", root: "src" },
  { app: "ai-content-planner", kind: "next", root: "." },
  { app: "conversion-friction-analyzer", kind: "next", root: "." },
  { app: "ai-competitor-comparison", kind: "next", root: "." },
  { app: "booking-agent", kind: "flask", slug: "booking-agent" },
];

const MARKER = "GENERATED — edit in dashboard/, then run scripts/sync-shared.mjs";

function withMarker(file, source) {
  if (file.endsWith(".css")) return `/* ${MARKER} */\n\n${source}`;
  if (file.endsWith(".html")) return `<!-- ${MARKER} -->\n${source}\n`;
  return `// ${MARKER}\n\n${source}`;
}

/** Map of target-relative path → file contents (without the marker). */
function filesFor(target) {
  if (target.kind === "next") {
    return Object.fromEntries(
      KIT_FILES.map((file) => [join(target.root, file), readFileSync(join(DASHBOARD, file), "utf8")]),
    );
  }

  const rendered = JSON.parse(
    execFileSync("npx", ["tsx", "scripts/build-static-kit.tsx", target.slug], {
      cwd: DASHBOARD,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  return {
    ...rendered,
    "static/jaseir-kit.css": readFileSync(join(DASHBOARD, "styles/jaseir-kit.css"), "utf8"),
    "static/jaseir-kit.js": readFileSync(join(DASHBOARD, "static-kit/jaseir-kit.js"), "utf8"),
  };
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const named = args.filter((a) => !a.startsWith("--"));

const unknown = named.filter((n) => !TARGETS.some((t) => t.app === n));
if (unknown.length) {
  console.error(`Unknown target(s): ${unknown.join(", ")}`);
  console.error(`Known: ${TARGETS.map((t) => t.app).join(", ")}`);
  process.exit(1);
}

const targets = named.length ? TARGETS.filter((t) => named.includes(t.app)) : TARGETS;

let written = 0;
let unchanged = 0;
let drift = 0;
let refused = 0;

for (const target of targets) {
  const appDir = join(HUB, target.app);
  if (!existsSync(appDir)) {
    console.error(`✗ ${target.app}: not found at ${appDir}`);
    refused++;
    continue;
  }

  if (target.kind === "next") {
    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
    if (!pkg.dependencies?.["lucide-react"]) {
      console.warn(`! ${target.app}: lucide-react is not installed — run \`npm install lucide-react\` there.`);
    }
  }

  console.log(`\n${target.app}`);
  for (const [file, source] of Object.entries(filesFor(target))) {
    const next = withMarker(file, source);
    const dest = join(appDir, file);
    const shown = relative(HUB, dest);

    if (existsSync(dest)) {
      const current = readFileSync(dest, "utf8");
      if (!current.includes(MARKER)) {
        console.error(`  ✗ ${shown} exists and is not a generated kit file — left untouched.`);
        refused++;
        continue;
      }
      if (current === next) {
        unchanged++;
        continue;
      }
    }

    if (check) {
      console.log(`  ~ ${shown} is out of date`);
      drift++;
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, next);
    console.log(`  ✓ ${shown}`);
    written++;
  }
}

console.log(
  check
    ? `\n${drift} out of date, ${unchanged} up to date, ${refused} refused.`
    : `\n${written} written, ${unchanged} unchanged, ${refused} refused.`,
);
if (refused || (check && drift)) process.exit(1);
