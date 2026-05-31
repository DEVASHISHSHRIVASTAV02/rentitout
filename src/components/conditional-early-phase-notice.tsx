"use client";

import { usePathname } from "next/navigation";
import { EarlyPhaseNotice } from "@/components/early-phase-notice";

export function ConditionalEarlyPhaseNotice() {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/, "") || "/";

  if (normalizedPathname !== "/") {
    return null;
  }

  return <EarlyPhaseNotice />;
}
