import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";

/*
  Sessions, stored in the database rather than signed into the cookie.

  The cookie carries 32 random bytes, base64url. The table stores only the SHA-256 of those
  bytes, so a dump of `sessions` cannot be replayed as a cookie — the same reason a password
  table stores hashes. There is no signing secret to rotate as a result: DATABASE_URL is the
  only thing in .env.local.

  A plain hash rather than scrypt is right here and wrong for passwords: the token is already
  32 bytes of entropy, so there is nothing to brute-force, and this runs on every request.
*/

export const SESSION_COOKIE = "nutriva.session";
const SESSION_DAYS = 30;

function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

/** Issues a session and sets the cookie. Call only after credentials have been verified. */
export async function startSession(userId: string, userAgent?: string | null): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    "insert into sessions (user_id, token_hash, user_agent, expires_at) values ($1, $2, $3, $4)",
    [userId, hashToken(token), userAgent?.slice(0, 400) ?? null, expiresAt],
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    // `secure: true` unconditionally would stop the cookie being set over http://localhost,
    // which is where this runs in development.
    secure: process.env.NODE_ENV === "production",
  });
}

export type SessionUser = { id: string; displayName: string };

/**
 * Resolves the cookie to a user, or null. Expired rows are treated as absent and swept on the
 * way past, which is cheap here and saves a scheduled job.
 */
export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<{ id: string; display_name: string }>(
    `select u.id, u.display_name
     from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );

  return row ? { id: row.id, displayName: row.display_name } : null;
}

/** Deletes the current session row and clears the cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await query("delete from sessions where token_hash = $1", [hashToken(token)]);
  store.delete(SESSION_COOKIE);
}

/** Housekeeping for expired rows, called opportunistically after a sign-in. */
export async function pruneExpiredSessions(): Promise<void> {
  await query("delete from sessions where expires_at < now()");
}
