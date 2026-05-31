import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";
import { SEO_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";
import { SITEMAP_STATIC_ROUTES } from "@/lib/sitemap-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_ROUTES.map((route) => ({
    url: toAbsoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const intentEntries: MetadataRoute.Sitemap = SEO_CITY_CATEGORY_INTENTS.map((intent) => ({
    url: toAbsoluteUrl(intent.path),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticEntries, ...intentEntries];
}
