import "server-only";

import crypto from "crypto";
import { query } from "@/lib/db";
import { type ContactCaptchaChallenge, type RevealedContactDetails } from "@/lib/contact-gate-types";

const CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const CAPTCHA_LENGTH = 7;
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const MIN_SOLVE_TIME_MS = 2500;
const MAX_ATTEMPTS_PER_CHALLENGE = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHALLENGE_REQUESTS_PER_WINDOW = 24;
const MAX_VERIFY_REQUESTS_PER_WINDOW = 48;

type RateLimitKind = "challenge" | "verify";

interface StoredChallenge {
  listingId: string;
  answerHash: string;
  ip: string;
  userAgentHash: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
}

interface ContactRow {
  is_active: boolean;
  full_name: string | null;
  listing_contact_email: string | null;
  listing_phone: string | null;
  profile_email: string | null;
  profile_phone: string | null;
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
  var __RentItOutContactChallenges: Map<string, StoredChallenge> | undefined;
  var __RentItOutContactGateRateLimit: Map<string, number[]> | undefined;
}

function getChallengeStore() {
  if (!global.__RentItOutContactChallenges) {
    global.__RentItOutContactChallenges = new Map<string, StoredChallenge>();
  }
  return global.__RentItOutContactChallenges;
}

function getRateLimitStore() {
  if (!global.__RentItOutContactGateRateLimit) {
    global.__RentItOutContactGateRateLimit = new Map<string, number[]>();
  }
  return global.__RentItOutContactGateRateLimit;
}

function getCaptchaSecret() {
  const value = process.env.CONTACT_GATE_SECRET ?? process.env.AUTH_OTP_SECRET ?? "";
  if (!value) {
    throw new ContactGateError("Contact gate secret is not configured", 500);
  }
  return value;
}

function hashUserAgent(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
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

function buildRateLimitKey(kind: RateLimitKind, ip: string) {
  return `${kind}:${ip}`;
}

function isRateLimited(ip: string, kind: RateLimitKind) {
  const now = Date.now();
  const store = getRateLimitStore();
  const key = buildRateLimitKey(kind, ip);
  const maxEvents = kind === "challenge" ? MAX_CHALLENGE_REQUESTS_PER_WINDOW : MAX_VERIFY_REQUESTS_PER_WINDOW;
  const existing = store.get(key) ?? [];
  const fresh = existing.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (fresh.length >= maxEvents) {
    store.set(key, fresh);
    return true;
  }

  fresh.push(now);
  store.set(key, fresh);
  return false;
}

function cleanupStores() {
  const now = Date.now();

  const challengeStore = getChallengeStore();
  for (const [challengeId, challenge] of challengeStore.entries()) {
    if (challenge.expiresAt <= now) {
      challengeStore.delete(challengeId);
    }
  }

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

function createVerificationCode(length: number) {
  return Array.from({ length }, () => CAPTCHA_ALPHABET[crypto.randomInt(0, CAPTCHA_ALPHABET.length)]).join("");
}

function createSeededRandom(seedInput: string) {
  const hash = crypto.createHash("sha256").update(seedInput).digest();
  let state = hash.readUInt32BE(0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createCaptchaSvg(code: string, challengeId: string) {
  const seededRandom = createSeededRandom(`${challengeId}:${code}`);
  const width = 250;
  const height = 84;
  const fontSize = 37;
  const baseY = 56;

  const characters = code
    .split("")
    .map((char, index) => {
      const x = 20 + index * 30 + Math.floor(seededRandom() * 4);
      const y = baseY + Math.floor((seededRandom() - 0.5) * 10);
      const rotate = Math.floor((seededRandom() - 0.5) * 38);
      const skew = (seededRandom() - 0.5) * 0.35;
      const tone = 15 + Math.floor(seededRandom() * 35);
      return `<text x="${x}" y="${y}" fill="hsl(220 12% ${tone}%)" font-size="${fontSize}" font-family="monospace" font-weight="700" transform="rotate(${rotate} ${x} ${y}) skewX(${skew.toFixed(3)})">${char}</text>`;
    })
    .join("");

  const lines = Array.from({ length: 6 }, (_, index) => {
    const x1 = Math.floor(seededRandom() * width);
    const y1 = Math.floor(seededRandom() * height);
    const x2 = Math.floor(seededRandom() * width);
    const y2 = Math.floor(seededRandom() * height);
    const opacity = (0.24 + seededRandom() * 0.33).toFixed(2);
    const strokeWidth = index % 2 === 0 ? 1 : 2;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(63,63,70,${opacity})" stroke-width="${strokeWidth}" />`;
  }).join("");

  const dots = Array.from({ length: 30 }, () => {
    const cx = Math.floor(seededRandom() * width);
    const cy = Math.floor(seededRandom() * height);
    const radius = (0.7 + seededRandom() * 1.8).toFixed(2);
    const opacity = (0.15 + seededRandom() * 0.3).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(82,82,91,${opacity})" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fafafa" />
        <stop offset="100%" stop-color="#e4e4e7" />
      </linearGradient>
      <filter id="blurNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.06" />
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    <rect width="${width}" height="${height}" filter="url(#blurNoise)" />
    ${lines}
    ${dots}
    ${characters}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function hashAnswer(challengeId: string, answer: string) {
  return crypto
    .createHash("sha256")
    .update(`${challengeId}:${answer}:${getCaptchaSecret()}`)
    .digest("hex");
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

export function createContactChallenge(listingId: string, context: ContactGateRequestContext): ContactCaptchaChallenge {
  cleanupStores();

  if (isRateLimited(context.ip, "challenge")) {
    throw new ContactGateError("Too many challenge requests. Please try again shortly.", 429);
  }

  const challengeId = crypto.randomUUID();
  const code = createVerificationCode(CAPTCHA_LENGTH);
  const now = Date.now();
  const challengeStore = getChallengeStore();

  challengeStore.set(challengeId, {
    listingId,
    answerHash: hashAnswer(challengeId, code),
    ip: context.ip,
    userAgentHash: hashUserAgent(context.userAgent),
    attempts: 0,
    createdAt: now,
    expiresAt: now + CHALLENGE_TTL_MS,
  });

  return {
    challengeId,
    captchaSvgDataUrl: createCaptchaSvg(code, challengeId),
    expiresInSeconds: Math.floor(CHALLENGE_TTL_MS / 1000),
    minSolveSeconds: Math.floor(MIN_SOLVE_TIME_MS / 1000),
  };
}

interface VerifyContactChallengeInput {
  listingId: string;
  challengeId: string;
  answer: string;
}

export function verifyContactChallenge(
  input: VerifyContactChallengeInput,
  context: ContactGateRequestContext,
): void {
  cleanupStores();

  if (isRateLimited(context.ip, "verify")) {
    throw new ContactGateError("Too many attempts. Please try again shortly.", 429);
  }

  const challengeStore = getChallengeStore();
  const challenge = challengeStore.get(input.challengeId);
  if (!challenge) {
    throw new ContactGateError("Challenge expired. Please request a new one.", 410);
  }

  if (challenge.listingId !== input.listingId) {
    challengeStore.delete(input.challengeId);
    throw new ContactGateError("Challenge mismatch. Please retry.", 400);
  }

  const now = Date.now();
  if (challenge.expiresAt <= now) {
    challengeStore.delete(input.challengeId);
    throw new ContactGateError("Challenge expired. Please request a new one.", 410);
  }

  if (challenge.ip !== context.ip) {
    challengeStore.delete(input.challengeId);
    throw new ContactGateError("Challenge invalid for this connection. Please retry.", 400);
  }

  if (challenge.userAgentHash !== hashUserAgent(context.userAgent)) {
    challengeStore.delete(input.challengeId);
    throw new ContactGateError("Challenge invalid for this device. Please retry.", 400);
  }

  if (now - challenge.createdAt < MIN_SOLVE_TIME_MS) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_ATTEMPTS_PER_CHALLENGE) {
      challengeStore.delete(input.challengeId);
    } else {
      challengeStore.set(input.challengeId, challenge);
    }
    throw new ContactGateError("Answered too quickly. Please retry after reading the code.", 400);
  }

  const answerHash = hashAnswer(input.challengeId, input.answer.trim());
  const valid = crypto.timingSafeEqual(Buffer.from(answerHash), Buffer.from(challenge.answerHash));
  if (!valid) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_ATTEMPTS_PER_CHALLENGE) {
      challengeStore.delete(input.challengeId);
      throw new ContactGateError("Too many incorrect attempts. Request a new challenge.", 400);
    }
    challengeStore.set(input.challengeId, challenge);
    throw new ContactGateError("Incorrect code. Please try again.", 400);
  }

  challengeStore.delete(input.challengeId);
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
