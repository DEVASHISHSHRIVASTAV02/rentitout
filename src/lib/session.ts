import crypto from "crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

const SESSION_COOKIE_NAME = "RentItOut_session";
const SESSION_DURATION_DAYS = 30;
const READONLY_COOKIE_ERROR = "Cookies can only be modified in a Server Action or Route Handler";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
}

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date;
}

function isReadonlyCookieMutationError(error: unknown) {
  return error instanceof Error && error.message.includes(READONLY_COOKIE_ERROR);
}

export async function createUserSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate();

  await query(
    `insert into sessions (user_id, session_token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await query("delete from sessions where session_token_hash = $1", [tokenHash]).catch(() => undefined);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
  }>(
    `
      select u.id, u.email, u.full_name
      from sessions s
      inner join users u on u.id = s.user_id
      where s.session_token_hash = $1
        and s.expires_at > now()
        and s.revoked_at is null
      limit 1
    `,
    [tokenHash],
  );

  const row = rows[0];
  if (!row) {
    try {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    } catch (error) {
      if (!isReadonlyCookieMutationError(error)) {
        throw error;
      }
    }
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
  };
}
