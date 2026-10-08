"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export function SiteHeaderBrand() {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/, "") || "/";
  const isHome = normalizedPathname === "/";

  if (isHome) {
    return (
      <Link href="/" className="inline-flex items-center gap-2">
        <span className="text-sm font-semibold tracking-[0.14em] text-white sm:text-base sm:tracking-[0.22em]">
          RentItOut
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Go to home page"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:h-9 sm:w-9"
    >
      <Home className="size-5 sm:size-[1.35rem]" aria-hidden="true" strokeWidth={1.75} />
    </Link>
  );
}
