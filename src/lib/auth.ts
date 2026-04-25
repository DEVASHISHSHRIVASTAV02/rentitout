import crypto from "crypto";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { query, withTransaction } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { clearUserSession, createUserSession, getSessionUser } from "@/lib/session";

const OTP_TTL_MINUTES = 10;

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string | null;
  };
}

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function getOtpSecret() {
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.RESEND_API_KEY ?? "";
  if (!secret) {
    throw new Error("Missing AUTH_OTP_SECRET or RESEND_API_KEY");
  }
  return secret;
}

function hashOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${otp}:${getOtpSecret()}`)
    .digest("hex");
}

function toAuthUser(row: { id: string; email: string; full_name: string | null }): AuthUser {
  return {
    id: row.id,
    email: row.email,
    user_metadata: {
      full_name: row.full_name,
    },
  };
}

export async function getCurrentUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return null;
  }

  return toAuthUser({
    id: sessionUser.id,
    email: sessionUser.email,
    full_name: sessionUser.fullName,
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function ensureProfile(user: AuthUser) {
  await query(
    `
      insert into profiles (id, email, full_name)
      values ($1, $2, $3)
      on conflict (id) do update
      set email = excluded.email
    `,
    [user.id, user.email, user.user_metadata.full_name],
  );
}

export async function signUpWithPassword(input: { fullName: string; email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const passwordHash = await hash(input.password, 12);

  const user = await withTransaction(async (client) => {
    const created = await client.query<{ id: string; email: string; full_name: string | null }>(
      `
        insert into users (email, password_hash, full_name)
        values ($1, $2, $3)
        returning id, email, full_name
      `,
      [email, passwordHash, input.fullName],
    );

    const row = created.rows[0];
    await client.query(
      `
        insert into profiles (id, email, full_name)
        values ($1, $2, $3)
        on conflict (id) do nothing
      `,
      [row.id, row.email, row.full_name],
    );

    return row;
  });

  await createUserSession(user.id);
  return toAuthUser(user);
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const { rows } = await query<{
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
  }>(
    `
      select u.id, u.email, u.password_hash, coalesce(p.full_name, u.full_name) as full_name
      from users u
      left join profiles p on p.id = u.id
      where lower(u.email) = $1
      limit 1
    `,
    [email],
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await compare(input.password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  await createUserSession(user.id);
  return toAuthUser({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
  });
}

export async function signOut() {
  await clearUserSession();
}

export async function requestSignInOtp(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const { rows } = await query<{ id: string }>("select id from users where lower(email) = $1 limit 1", [email]);
  const user = rows[0];
  if (!user) {
    throw new Error("No account found for this email");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(email, otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await withTransaction(async (client) => {
    await client.query(
      `
        update email_otps
        set consumed_at = now()
        where user_id = $1
          and purpose = 'sign_in'
          and consumed_at is null
      `,
      [user.id],
    );

    await client.query(
      `
        insert into email_otps (user_id, email, otp_hash, purpose, expires_at)
        values ($1, $2, $3, 'sign_in', $4)
      `,
      [user.id, email, otpHash, expiresAt.toISOString()],
    );

    await client.query(
      `
        update users
        set otp_request_count = otp_request_count + 1
        where id = $1
      `,
      [user.id],
    );
  });

  const result = await sendOtpEmail({ email, otp, expiresInMinutes: OTP_TTL_MINUTES });
  if (!result.sent) {
    throw new Error("OTP email service is not configured");
  }
}

export async function verifySignInOtp(input: { email: string; otp: string }) {
  const email = normalizeEmail(input.email);
  const normalizedOtp = input.otp.trim();
  const otpHash = hashOtp(email, normalizedOtp);

  const { rows } = await query<{ id: string }>(
    `
      select id
      from email_otps
      where lower(email) = $1
        and purpose = 'sign_in'
        and consumed_at is null
        and expires_at > now()
        and attempt_count < max_attempts
      order by created_at desc
      limit 1
    `,
    [email],
  );

  const otpRow = rows[0];
  if (!otpRow) {
    throw new Error("OTP expired or not found");
  }

  const { rowCount } = await query(
    `
      update email_otps
      set consumed_at = now()
      where id = $1
        and otp_hash = $2
        and consumed_at is null
        and attempt_count < max_attempts
    `,
    [otpRow.id, otpHash],
  );

  if (rowCount === 0) {
    await query(
      `
        update email_otps
        set attempt_count = attempt_count + 1,
            consumed_at = case
              when attempt_count + 1 >= max_attempts then now()
              else consumed_at
            end
        where id = $1
          and consumed_at is null
      `,
      [otpRow.id],
    );
    throw new Error("Invalid OTP");
  }

  const { rows: userRows } = await query<{ id: string; email: string; full_name: string | null }>(
    `
      select u.id, u.email, coalesce(p.full_name, u.full_name) as full_name
      from users u
      left join profiles p on p.id = u.id
      where lower(u.email) = $1
      limit 1
    `,
    [email],
  );

  const user = userRows[0];
  if (!user) {
    throw new Error("Account no longer exists");
  }

  await createUserSession(user.id);
  return toAuthUser(user);
}
