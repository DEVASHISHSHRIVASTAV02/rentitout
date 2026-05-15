import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const FALLBACK_CANONICAL_HOST = "rentitout.in";

function getCanonicalHost() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) {
    return FALLBACK_CANONICAL_HOST;
  }

  try {
    const host = new URL(configuredUrl).host.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return FALLBACK_CANONICAL_HOST;
  }
}

const CANONICAL_HOST = getCanonicalHost();

export function proxy(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const host = hostHeader.split(",")[0]?.trim().toLowerCase() ?? "";

  if (host === `www.${CANONICAL_HOST}`) {
    const destination = request.nextUrl.clone();
    destination.host = CANONICAL_HOST;
    return NextResponse.redirect(destination, 308);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
