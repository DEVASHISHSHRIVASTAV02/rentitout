import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.14em] text-zinc-950 sm:text-base sm:tracking-[0.22em]">
            RentItOut
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <Link href="/my-account">
              <Button variant="secondary" className="h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm">
                My Account
              </Button>
            </Link>
          ) : (
            <Link href="/auth/sign-in">
              <Button variant="primary" className="h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
