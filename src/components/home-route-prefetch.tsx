"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HOME_PREFETCH_ROUTES = [
  "/browse",
  "/auth/sign-in?next=%2Fmy-account",
  "/rental-agreement-templates",
  "/rentals",
  "/faqs",
] as const;

export function HomeRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const href of HOME_PREFETCH_ROUTES) {
      router.prefetch(href);
    }
  }, [router]);

  return null;
}
