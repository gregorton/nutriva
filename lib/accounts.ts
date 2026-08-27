import "server-only";
import { queryOne } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

/*
  Accounts. Email and password only — there is no mail sender behind this storefront, so there
  is no verification link, no password reset and no social login. Adding any of those means
  adding a provider first.

  Two rules the whole file exists to hold:

  1. Nothing here returns a row. Callers get an `Account` with an id and a display name; the
     hash and the throttle counters never leave this module.
  2. A wrong email and a wrong password fail identically, and both spend the same time failing.
     Distinguishing them turns the sign-in form into a tool for finding out who has an account.
*/

export type Account = { id: string; displayName: string };

type UserRow = {
  id: string;
  password_hash: string;
  display_name: string;
  failed_attempts: number;
  locked_until: Date | null;
};

/** Ten wrong passwords buys a fifteen-minute lockout on that address. */
const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

export type SignUpResult =
  | { ok: true; account: Account }
  | { ok: false; reason: "email-taken" };

export async function createAccount(
  email: string,
  password: string,
  displayName: string,
): Promise<SignUpResult> {
  const passwordHash = await hashPassword(password);

  // `on conflict do nothing` returns no row when the address is taken, which is the check —
  // no separate "does this exist" query to race against.
  const row = await queryOne<{ id: string; display_name: string }>(
    `insert into users (email, password_hash, display_name)
     values ($1, $2, $3)
     on conflict (email) do nothing
     returning id, display_name`,
    [email, passwordHash, displayName],
  );

  if (!row) return { ok: false, reason: "email-taken" };
  return { ok: true, account: { id: row.id, displayName: row.display_name } };
}

export type SignInResult =
  | { ok: true; account: Account }
  | { ok: false; reason: "invalid" | "locked" };

export async function authenticate(email: string, password: string): Promise<SignInResult> {
  const user = await queryOne<UserRow>(
    `select id, password_hash, display_name, failed_attempts, locked_until
     from users where email = $1`,
    [email],
  );

  if (!user) {
    // Spend a hash anyway. Returning early here would make "no such account" measurably faster
    // than "wrong password", which is the whole thing the generic message is hiding.
    await hashPassword(password);
    return { ok: false, reason: "invalid" };
  }

  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const attempts = user.failed_attempts + 1;
    await queryOne(
      `update users
       set failed_attempts = $2,
           locked_until = case when $2 >= $3 then now() + ($4 || ' minutes')::interval else null end
       where id = $1
       returning id`,
      [user.id, attempts, MAX_ATTEMPTS, LOCKOUT_MINUTES],
    );
    return { ok: false, reason: attempts >= MAX_ATTEMPTS ? "locked" : "invalid" };
  }

  if (user.failed_attempts > 0 || user.locked_until) {
    await queryOne(
      "update users set failed_attempts = 0, locked_until = null where id = $1 returning id",
      [user.id],
    );
  }

  return { ok: true, account: { id: user.id, displayName: user.display_name } };
}
