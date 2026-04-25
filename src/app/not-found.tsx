import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">404</p>
      <h1 className="text-4xl font-semibold text-zinc-950">Page Not Found</h1>
      <p className="text-zinc-600">The page you are looking for does not exist or may have been moved.</p>
      <Link href="/browse">
        <Button>Browse Listings</Button>
      </Link>
    </div>
  );
}

