"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

const AUTH_FOOTER_HIDDEN_PATHS = new Set(["/auth/sign-in", "/auth/sign-up"]);

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/, "") || "/";

  if (AUTH_FOOTER_HIDDEN_PATHS.has(normalizedPathname)) {
    return null;
  }

  return <SiteFooter />;
}
