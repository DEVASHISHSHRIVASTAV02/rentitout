import type { MetadataRoute } from "next";
import { APP_ORIGIN, toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/dashboard", "/my-account"],
      },
    ],
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: APP_ORIGIN,
  };
}
