import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";

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
 * - lastmod is the last git commit touching the page's files (plus the
 *   data/components it is built from, see PAGE_SOURCES). If no commit
 *   date can be found, lastmod is left out rather than guessed.
 * - The RAG industry demos (/rag-knowledge-assistant/demo/*) are noindex
 *   and deliberately not listed.
 */

const SITE = "https://ai.jaseir.com";

/** Top-level app/ folders that must never be listed. */
const EXCLUDE = new Set(["api", "leads-admin", "rag-debug"]);

/**
 * Other apps served under ai.jaseir.com. `path` must be the exact URL
 * the app answers with 200: some use a trailing slash, some don't.
 * `repo` is the GitHub repo name; its checkout (a sibling folder of this
 * one, under any folder name) is used for lastmod.
 */
const AGENT_APPS = [
  { path: "/ai-lead-qualification/", repo: "ai-lead-qualification" },
  { path: "/ai-planner", repo: "ai-planner" },
  { path: "/ai-content-planner/", repo: "ai-content-planner" },
  { path: "/conversion-friction-analyzer", repo: "conversion-friction-analyzer" },
  { path: "/ai-competitor-comparison/", repo: "ai-competitor-comparison" },
  { path: "/ai-booking-agent/", repo: "ai-booking-agent" },
];

/** Extra files/folders (relative to ROOT) a page's content comes from. */
const PAGE_SOURCES: Record<string, string[]> = {
  "/": ["app/components/hero", "app/components/rag/RagHomeSection.tsx", "lib/agents.ts", "lib/agent-metadata.ts"],
  "/rag-knowledge-assistant/": ["app/data/rag-page.ts", "app/components/rag"],
};

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");

function git(cwd: string, args: string[]): string {
  try {
    return execFileSync("git", ["-c", "safe.directory=*", ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }).trim();
  } catch {
    return "";
  }
}

/** Last commit date touching any of `files` (relative to `cwd`), or undefined. */
function lastModified(cwd: string, files: string[]): Date | undefined {
  const out = git(cwd, ["--literal-pathspecs", "log", "-1", "--format=%cI", "--", ...files]);
  const date = new Date(out);
  return out && !Number.isNaN(date.getTime()) ? date : undefined;
}

/** Sibling checkout whose origin is github.com/<owner>/<repo>, whatever the folder is called. */
function findCheckout(repo: string): string | undefined {
  const parent = path.join(ROOT, "..");
  const pattern = new RegExp(`[:/]${repo}(\\.git)?/?$`, "i");
  const dirs = [repo, ...readdirSync(parent).filter((name) => name !== repo)].map((name) => path.join(parent, name));
  return dirs.find((dir) => existsSync(path.join(dir, ".git")) && pattern.test(git(dir, ["remote", "get-url", "origin"])));
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
    lastModified: lastModified(ROOT, [...filesIn(dir), ...(PAGE_SOURCES[url] ?? [])]),
  }));

  const agents: MetadataRoute.Sitemap = AGENT_APPS.map(({ path: urlPath, repo }) => {
    const checkout = findCheckout(repo);
    return {
      url: `${SITE}${urlPath}`,
      lastModified: checkout ? lastModified(checkout, ["."]) : undefined,
    };
  });

  return [...pages, ...agents];
}
