import type { MetadataRoute } from "next";

export type SitemapRouteConfig = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/**
 * Public static routes eligible for sitemap.xml.
 *
 * Included only when the page is indexable (no `noIndex` metadata) and is a
 * meaningful discovery entry point. Excludes auth, account, dashboard,
 * redirect-only routes, placeholder pages such as /careers, and volatile
 * inventory URLs such as individual listing detail pages.
 */
export const SITEMAP_STATIC_ROUTES: SitemapRouteConfig[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/browse", changeFrequency: "hourly", priority: 0.95 },
  { path: "/rentals", changeFrequency: "daily", priority: 0.9 },
  { path: "/why-choose-us", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faqs", changeFrequency: "monthly", priority: 0.65 },
  { path: "/about-us", changeFrequency: "monthly", priority: 0.6 },
  { path: "/rental-agreement-templates", changeFrequency: "weekly", priority: 0.75 },
  { path: "/privacy-policy", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms-and-conditions", changeFrequency: "monthly", priority: 0.4 },
];
