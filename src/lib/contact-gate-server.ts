import "server-only";

import { query } from "@/lib/db";
import { type RevealedContactDetails } from "@/lib/contact-gate-types";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_VERIFY_REQUESTS_PER_WINDOW = 48;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface ContactRow {
  is_active: boolean;
  full_name: string | null;
  listing_contact_email: string | null;
  listing_phone: string | null;
  profile_email: string | null;
  profile_phone: string | null;
}

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export class ContactGateError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ContactGateError";
    this.status = status;
  }
}

declare global {
  var __RentItOutContactGateRateLimit: Map<string, number[]> | undefined;
}

function getRateLimitStore() {
  if (!global.__RentItOutContactGateRateLimit) {
    global.__RentItOutContactGateRateLimit = new Map<string, number[]>();
  }
  return global.__RentItOutContactGateRateLimit;
}

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }
  return value
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function getRequestIp(request: Request) {
  return normalizeIp(
    request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for"),
  );
}

function getRequestUserAgent(request: Request) {
  return (request.headers.get("user-agent") ?? "").trim();
}

function buildRateLimitKey(ip: string) {
  return `verify:${ip}`;
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const store = getRateLimitStore();
  const key = buildRateLimitKey(ip);
  const existing = store.get(key) ?? [];
  const fresh = existing.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (fresh.length >= MAX_VERIFY_REQUESTS_PER_WINDOW) {
    store.set(key, fresh);
    return true;
  }

  fresh.push(now);
  store.set(key, fresh);
  return false;
}

function cleanupStores() {
  const now = Date.now();
  const rateStore = getRateLimitStore();
  for (const [key, events] of rateStore.entries()) {
    const fresh = events.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
    if (fresh.length === 0) {
      rateStore.delete(key);
      continue;
    }
    rateStore.set(key, fresh);
  }
}

function getRecaptchaSecretKey() {
  const secret = process.env.RECAPTCHA_SECRET_KEY ?? "";
  if (!secret) {
    throw new ContactGateError("Captcha secret is not configured", 500);
  }
  return secret;
}

function mapRecaptchaFailure(errorCodes: string[]) {
  if (errorCodes.includes("timeout-or-duplicate")) {
    return "Captcha token expired. Please complete verification again.";
  }
  if (
    errorCodes.includes("invalid-input-response") ||
    errorCodes.includes("missing-input-response")
  ) {
    return "Please complete captcha verification.";
  }
  return "Captcha verification failed. Please try again.";
}

export interface ContactGateRequestContext {
  ip: string;
  userAgent: string;
}

export function getContactGateRequestContext(request: Request): ContactGateRequestContext {
  return {
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  };
}

export async function verifyRecaptchaToken(token: string, context: ContactGateRequestContext): Promise<void> {
  cleanupStores();

  if (isRateLimited(context.ip)) {
    throw new ContactGateError("Too many attempts. Please try again shortly.", 429);
  }

  const recaptchaToken = token.trim();
  if (!recaptchaToken) {
    throw new ContactGateError("Please complete captcha verification.", 400);
  }

  const body = new URLSearchParams({
    secret: getRecaptchaSecretKey(),
    response: recaptchaToken,
  });

  if (context.ip !== "unknown") {
    body.set("remoteip", context.ip);
  }

  let response: Response;
  try {
    response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });
  } catch {
    throw new ContactGateError("Captcha verification service is unavailable. Please try again.", 502);
  }

  if (!response.ok) {
    throw new ContactGateError("Captcha verification service is unavailable. Please try again.", 502);
  }

  const payload = (await response.json()) as RecaptchaVerifyResponse;
  if (!payload.success) {
    const errorCodes = payload["error-codes"] ?? [];
    throw new ContactGateError(mapRecaptchaFailure(errorCodes), 400);
  }
}

export async function getListingContactDetailsForReveal(listingId: string): Promise<RevealedContactDetails | null> {
  const { rows } = await query<ContactRow>(
    `
      select
        l.is_active,
        p.full_name,
        l.contact_email as listing_contact_email,
        l.phone as listing_phone,
        case when p.show_email_on_listing then p.email::text else null end as profile_email,
        case when p.show_phone_on_listing then p.phone else null end as profile_phone
      from listing l
      left join profiles p on p.id = l.owner_id
      where l.id::text = $1
      limit 1
    `,
    [listingId],
  );

  const row = rows[0];
  if (!row || !row.is_active) {
    return null;
  }

  return {
    ownerName: row.full_name ?? null,
    contactEmail: row.listing_contact_email ?? row.profile_email ?? null,
    contactPhone: row.listing_phone ?? row.profile_phone ?? null,
  };
}
