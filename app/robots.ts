import type { MetadataRoute } from "next";

/*
 * /robots.txt for all of ai.jaseir.com.
 *
 * /leads-admin/ is deliberately NOT disallowed: Google has to crawl it
 * to see its noindex tag. It's protected by the admin key instead.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://ai.jaseir.com/sitemap.xml",
  };
}
