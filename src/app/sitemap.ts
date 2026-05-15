import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { toAbsoluteUrl } from "@/lib/seo";
import { SEO_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";

interface SitemapListingRow {
  id: string;
  updated_at: string;
}

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/browse", changeFrequency: "hourly", priority: 0.95 },
  { path: "/rentals", changeFrequency: "daily", priority: 0.9 },
  { path: "/about-us", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "weekly", priority: 0.5 },
  { path: "/rental-agreement-templates", changeFrequency: "weekly", priority: 0.75 },
  { path: "/privacy-policy", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms-and-conditions", changeFrequency: "monthly", priority: 0.4 },
];

async function getListingSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const { rows } = await query<SitemapListingRow>(
      `
        select
          id,
          updated_at::text
        from listing
        where is_active = true
        order by updated_at desc
        limit 50000
      `,
    );

    return rows.map((row) => ({
      url: toAbsoluteUrl(`/listings/${row.id}`),
      lastModified: new Date(row.updated_at),
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
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

  const listingEntries = await getListingSitemapEntries();

  return [...staticEntries, ...intentEntries, ...listingEntries];
}
