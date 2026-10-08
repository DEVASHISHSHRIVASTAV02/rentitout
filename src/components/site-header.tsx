import Link from "next/link";
import { UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteHeaderBrand } from "@/components/site-header-brand";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <SiteHeaderBrand />

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <Link
              href="/my-account"
              aria-label="My Account"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <UserRound className="size-5 sm:size-[1.35rem]" aria-hidden="true" strokeWidth={1.75} />
            </Link>
          ) : (
            <Link href="/auth/sign-in" prefetch={false}>
              <Button
                variant="primary"
                className="h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
