This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Shared site kit (header, footer, agent template)

ai.jaseir.com is served by several separate apps (this dashboard plus one app per agent). They all share one header, footer, agent registry and agent page template. **This repo is the source of truth** for those files:

| File | What it is |
|---|---|
| `lib/agents.ts` | Every agent: name, tagline, icon, URL, accent palette, SEO copy, related agents |
| `lib/site.ts` | Shared links (services, company, contact) and cross-app link helpers |
| `lib/agent-metadata.ts` | Root-layout `metadata` for the hub and for each agent app |
| `components/layout/*` | `SiteHeader`, `SiteFooter` (with the CTA band), `CurrentYear` |
| `components/agent/*` | Agent page template sections, loading steps, gauge, score bars, copy button, icons |
| `styles/jaseir-kit.css` | All kit styles (plain CSS, `jk-` prefix, accent via `--agent-*` variables) |

After editing any of these, copy them into the agent apps:

```bash
node scripts/sync-shared.mjs                         # every enabled app
node scripts/sync-shared.mjs ai-lead-qualification   # one app
node scripts/sync-shared.mjs --check                 # report out-of-date copies, write nothing
```

Each copy starts with `GENERATED — edit in dashboard/, then run scripts/sync-shared.mjs`. Don't edit the copies — changes are overwritten on the next sync.

**Flask booking agent (`booking-agent/`)** isn't React, so the sync script renders the real `SiteHeader`, `SiteFooter` and `RelatedAgents` components to static HTML (`scripts/build-static-kit.tsx`) and writes them to `booking-agent/templates/partials/`, along with `static/jaseir-kit.css` and `static/jaseir-kit.js` (menu behaviour, source in `static-kit/`). The Flask template includes the partials, so the header and footer there always match the Next.js apps.

The script is safe to re-run: it writes only the files listed in `KIT_FILES`, skips files that are already identical, and refuses to overwrite any existing file that doesn't carry the GENERATED marker (so app-specific code is never touched). Targets are listed in `TARGETS` at the top of the script. Each Next.js target needs `lucide-react` installed.

To add a new agent: add it to `lib/agents.ts`, run the sync, and it appears in the header mega-menu, footer and related-agent strips everywhere.
