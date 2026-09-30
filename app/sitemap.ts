import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { INDUSTRY_DEMO_IDS } from "./data/rag-demos";

/* ------------------------------------------------------------------ */
/* /sitemap.xml — the ONLY sitemap for https://ai.jaseir.com           */
/* ------------------------------------------------------------------ */
/*
 * Generated once at build time (Next caches sitemap.ts by default).
 *
 * - Dashboard pages are found by scanning app/ for page.tsx, so a new
 *   page shows up here on the next build. Private pages are in EXCLUDE.
 * - The agents are separate apps behind the same domain, so they're
 *   listed in AGENT_APPS. Add a new agent there.
 * - lastmod is the last git commit touching the page's files; if git
 *   isn't available it falls back to the build time.
 */

const SITE = "https://ai.jaseir.com";

/** Top-level app/ folders that must never be listed. */
const EXCLUDE = new Set(["api", "leads-admin", "rag-debug"]);

/**
 * Other apps served under ai.jaseir.com. `path` must be the exact URL
 * the app answers with 200: some use a trailing slash, some don't.
 * `repo` is the sibling checkout used for lastmod when it exists.
 */
const AGENT_APPS = [
  { path: "/ai-lead-qualification/", repo: "ai-lead-qualification" },
  { path: "/ai-planner", repo: "ai-planner" },
  { path: "/ai-content-planner/", repo: "ai-content-planner" },
  { path: "/conversion-friction-analyzer", repo: "conversion-friction-analyzer" },
  { path: "/ai-competitor-comparison/", repo: "ai-competitor-comparison" },
  { path: "/ai-booking-agent/", repo: "booking-agent" },
];

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const BUILD_TIME = new Date();

/** Last commit date touching any of `files` (relative to `cwd`), or the build time. */
function lastModified(cwd: string, files: string[]): Date {
  try {
    const out = execFileSync(
      "git",
      ["-c", "safe.directory=*", "--literal-pathspecs", "log", "-1", "--format=%cI", "--", ...files],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10_000 },
    ).trim();
    const date = new Date(out);
    return out && !Number.isNaN(date.getTime()) ? date : BUILD_TIME;
  } catch {
    return BUILD_TIME;
  }
}

/** Files directly inside `dir` (not sub-routes), relative to ROOT. */
function filesIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => statSync(path.join(dir, name)).isFile())
    .map((name) => path.relative(ROOT, path.join(dir, name)));
}

/** Every static page route under app/, as "/segment/.../" URL paths. */
function dashboardRoutes(dir = APP_DIR, segments: string[] = []): { url: string; dir: string }[] {
  const routes: { url: string; dir: string }[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  if (entries.some((e) => e.isFile() && /^page\.(tsx?|jsx?|mdx?)$/.test(e.name))) {
    const visible = segments.filter((s) => !/^\(.*\)$/.test(s)); // drop (route groups)
    routes.push({ url: visible.length ? `/${visible.join("/")}/` : "/", dir });
  }

  for (const entry of entries) {
    const name = entry.name;
    if (!entry.isDirectory()) continue;
    if (segments.length === 0 && EXCLUDE.has(name)) continue;
    // Dynamic [segments] are listed explicitly; _private and @slots aren't routes.
    if (name.startsWith("[") || name.startsWith("_") || name.startsWith("@")) continue;
    routes.push(...dashboardRoutes(path.join(dir, name), [...segments, name]));
  }
  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = dashboardRoutes().map(({ url, dir }) => ({
    url: `${SITE}${url}`,
    lastModified: lastModified(ROOT, filesIn(dir)),
  }));

  const demoDir = path.join(APP_DIR, "rag-knowledge-assistant", "demo", "[industry]");
  const demoModified = lastModified(ROOT, [...filesIn(demoDir), "app/data/rag-demos.ts"]);
  const demos: MetadataRoute.Sitemap = INDUSTRY_DEMO_IDS.map((id) => ({
    url: `${SITE}/rag-knowledge-assistant/demo/${id}/`,
    lastModified: demoModified,
  }));

  const agents: MetadataRoute.Sitemap = AGENT_APPS.map(({ path: urlPath, repo }) => {
    const checkout = path.join(ROOT, "..", repo);
    return {
      url: `${SITE}${urlPath}`,
      lastModified: existsSync(path.join(checkout, ".git")) ? lastModified(checkout, ["."]) : BUILD_TIME,
    };
  });

  return [...pages, ...demos, ...agents];
}
