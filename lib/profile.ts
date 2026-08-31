import "server-only";
import { query, queryOne } from "@/lib/db";

/*
  The personal details behind /account/profile.

  Separate from lib/accounts.ts on purpose: that file is the credentials path and holds the rule
  that nothing it returns is a row. This one is the opposite job — it hands the account its own
  details back so it can edit them — and it is the only module allowed to return an email address
  to a component. lib/dal.ts still keeps the address out of everything else.
*/

export const GENDERS = ["female", "male", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export type Profile = {
  displayName: string;
  email: string | null;
  phone: string | null;
  /** yyyy-mm-dd, which is what `<input type="date">` reads and writes. */
  birthday: string | null;
  gender: Gender | null;
  /** Whether the password path is available to this account, and so whether the email is load-bearing. */
  hasPassword: boolean;
};

type ProfileRow = {
  display_name: string;
  email: string | null;
  phone: string | null;
  birthday: Date | null;
  gender: string | null;
  has_password: boolean;
};

export async function profileFor(userId: string): Promise<Profile | null> {
  const row = await queryOne<ProfileRow>(
    `select display_name, email, phone, birthday, gender,
            password_hash is not null as has_password
       from users where id = $1`,
    [userId],
  );
  if (!row) return null;

  return {
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    // `date` comes back as a Date at local midnight; slicing the ISO string would shift the day
    // west of UTC. Read the parts the driver already resolved instead.
    birthday: row.birthday ? localDate(row.birthday) : null,
    gender: (GENDERS as readonly string[]).includes(row.gender ?? "")
      ? (row.gender as Gender)
      : null,
    hasPassword: row.has_password,
  };
}

function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export type ProfileUpdate = {
  displayName: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  gender: Gender | null;
};

export type SaveProfileResult = { ok: true } | { ok: false; reason: "email-taken" };

/*
  One statement, every field. The email is the address the account signs in with, so a collision is
  the one failure worth naming — and it is caught off the unique violation rather than checked for
  first, which would be a race.

  ponytail: no re-authentication on an email change. There is no password reset behind this
  storefront, so a changed address cannot be turned into a takeover; the day a reset email exists,
  this needs the current password before it will move the address.
*/
export async function updateProfile(
  userId: string,
  update: ProfileUpdate,
): Promise<SaveProfileResult> {
  try {
    await query(
      `update users
          set display_name = $2,
              email = $3,
              phone = $4,
              birthday = $5::date,
              gender = $6
        where id = $1`,
      [
        userId,
        update.displayName,
        update.email,
        update.phone,
        update.birthday,
        update.gender,
      ],
    );
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "email-taken" };
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
