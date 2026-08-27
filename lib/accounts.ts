import "server-only";
import { query, queryOne, tx } from "@/lib/db";
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
  password_hash: string | null;
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

  // An account created through Google or Facebook has no password. Saying so would tell a stranger
  // which addresses have accounts, so it fails the same way a wrong password does.
  if (!user.password_hash) {
    await hashPassword(password);
    return { ok: false, reason: "invalid" };
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const attempts = user.failed_attempts + 1;
    // Every placeholder is cast. `$2` is both assigned to an integer column and compared against
    // `$3`, and without the casts Postgres cannot deduce one type for it and rejects the
    // statement — which is an error only ever reached by getting a password wrong.
    await queryOne(
      `update users
       set failed_attempts = $2::int,
           locked_until = case
             when $2::int >= $3::int then now() + ($4::int * interval '1 minute')
             else null
           end
       where id = $1::uuid
       returning id`,
      [user.id, attempts, MAX_ATTEMPTS, LOCKOUT_MINUTES],
    );
    return { ok: false, reason: attempts >= MAX_ATTEMPTS ? "locked" : "invalid" };
  }

  if (user.failed_attempts > 0 || user.locked_until) {
    await queryOne(
      "update users set failed_attempts = 0, locked_until = null where id = $1::uuid returning id",
      [user.id],
    );
  }

  return { ok: true, account: { id: user.id, displayName: user.display_name } };
}

/*
  Signing in through a provider. Three outcomes, in the order they are tried:

  1. We have seen this provider account before — sign in as whoever it belongs to.
  2. The provider gave us a *verified* address that matches an existing account — link the two, so
     somebody who signed up with a password and later presses "Sign in with Google" lands back in
     their own account rather than a second empty one.
  3. Neither — make a new account with no password.

  Linking on an unverified address would be an account takeover: register somebody's email at a
  provider that does not check it, press the button, and you are them. So an unverified address
  that matches an existing account is refused outright rather than linked or duplicated.
*/
export type ProviderSignInResult =
  | { ok: true; account: Account; created: boolean }
  | { ok: false; reason: "email-taken" };

export async function linkOrCreateAccount(
  provider: string,
  profile: { id: string; email: string | null; emailVerified: boolean; displayName: string | null },
): Promise<ProviderSignInResult> {
  const existingIdentity = await queryOne<{ id: string; display_name: string }>(
    `select u.id, u.display_name
     from identities i join users u on u.id = i.user_id
     where i.provider = $1 and i.provider_user_id = $2`,
    [provider, profile.id],
  );

  if (existingIdentity) {
    return {
      ok: true,
      created: false,
      account: { id: existingIdentity.id, displayName: existingIdentity.display_name },
    };
  }

  const email = profile.email;

  if (email) {
    const byEmail = await queryOne<{ id: string; display_name: string }>(
      "select id, display_name from users where email = $1",
      [email],
    );

    if (byEmail && !profile.emailVerified) return { ok: false, reason: "email-taken" };

    if (byEmail) {
      await query(
        `insert into identities (provider, provider_user_id, user_id, email)
         values ($1, $2, $3, $4)
         on conflict (provider, provider_user_id) do nothing`,
        [provider, profile.id, byEmail.id, email],
      );
      return {
        ok: true,
        created: false,
        account: { id: byEmail.id, displayName: byEmail.display_name },
      };
    }
  }

  // New account. One transaction, so a failure cannot leave a user row with no identity pointing
  // at it — which would be an account nobody could ever sign in to.
  const created = await tx(async (client) => {
    const inserted = await client.query<{ id: string; display_name: string }>(
      `insert into users (email, password_hash, display_name)
       values ($1, null, $2)
       returning id, display_name`,
      [email, displayNameFor(profile.displayName, email)],
    );
    const row = inserted.rows[0];

    await client.query(
      "insert into identities (provider, provider_user_id, user_id, email) values ($1, $2, $3, $4)",
      [provider, profile.id, row.id, email],
    );

    return row;
  });

  return {
    ok: true,
    created: true,
    account: { id: created.id, displayName: created.display_name },
  };
}

/**
 * Reviews are attributed by display name, so there has to be one. Providers usually give a name;
 * where they do not, the part of the address before the @ is a better guess than a placeholder,
 * and the person can be told to change it once there is a settings page to change it on.
 */
function displayNameFor(given: string | null, email: string | null): string {
  const candidate = given?.trim() || email?.split("@")[0]?.trim() || "";
  if (candidate.length >= 2) return candidate.slice(0, 40);
  return "Nutriva shopper";
}

/** Which providers an account has linked, for a future settings page. */
export function linkedProviders(userId: string): Promise<string[]> {
  return query<{ provider: string }>(
    "select provider from identities where user_id = $1 order by provider",
    [userId],
  ).then((rows) => rows.map((row) => row.provider));
}
