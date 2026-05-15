import type { MetadataRoute } from "next";
import { APP_ORIGIN, toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const robotsHost = new URL(APP_ORIGIN).host;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/my-account"],
      },
    ],
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: robotsHost,
  };
}
