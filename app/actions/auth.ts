"use server";

import { headers } from "next/headers";
import { authenticate, createAccount } from "@/lib/accounts";
import { endSession, pruneExpiredSessions, startSession } from "@/lib/session";
import { checkCredentials, checkRegistration } from "@/lib/validate";

/*
  Sign up, sign in, sign out.

  Server Actions are POST endpoints that anything can call directly, not just this site's forms,
  so every one of these validates its own input and none of them trusts a hidden field for
  anything but a destination path — which is itself checked before use.

  None of them call redirect(). They set or clear the cookie and hand back where to go, and the
  form navigates. The reason is the masthead: it is a client island (see
  components/account/account-store.ts) because a server component reading cookies in the root
  layout would make all 470 product pages dynamic. A redirect issued here would land on the new
  page with that island still holding the old snapshot, so the form refreshes the island first
  and then navigates. Without JavaScript the account is still created and the page says so.
*/

export type AuthState =
  | {
      errors?: Partial<Record<"email" | "password" | "displayName", string>>;
      message?: string;
      ok?: false;
    }
  | { ok: true; next: string }
  | undefined;

/**
 * `?next=` decides where to land after signing in, which makes it an open-redirect hole if it is
 * used as given. Only a same-site absolute path survives: a leading slash, and not "//host" or
 * "/\host", both of which browsers resolve as another origin.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return /^\/(?![/\\])/.test(next) ? next : "/account";
}

export async function signUp(_state: AuthState, form: FormData): Promise<AuthState> {
  const checked = checkRegistration(form);
  if (!checked.ok) return { errors: checked.errors };

  const { email, password, displayName } = checked.value;

  try {
    const created = await createAccount(email, password, displayName);
    if (!created.ok) {
      return { errors: { email: "There is already an account with that email address." } };
    }
    await startSession(created.account.id, (await headers()).get("user-agent"));
  } catch (error) {
    // An uncaught throw here reaches the client as a crashed form subtree, which loses whatever
    // was typed and says nothing useful. The detail belongs in the server log, not the page.
    console.error("Sign-up failed:", error);
    return { message: "Something went wrong creating the account. Try again in a moment." };
  }

  return { ok: true, next: safeNext(form.get("next")) };
}

export async function signIn(_state: AuthState, form: FormData): Promise<AuthState> {
  const checked = checkCredentials(form);
  if (!checked.ok) return { errors: checked.errors };

  const { email, password } = checked.value;

  try {
    const result = await authenticate(email, password);

    if (!result.ok) {
      return {
        message:
          result.reason === "locked"
            ? "Too many attempts. Try again in 15 minutes."
            : "That email and password do not match an account.",
      };
    }

    await startSession(result.account.id, (await headers()).get("user-agent"));
    await pruneExpiredSessions();
  } catch (error) {
    console.error("Sign-in failed:", error);
    return { message: "Something went wrong signing in. Try again in a moment." };
  }

  return { ok: true, next: safeNext(form.get("next")) };
}

export async function signOut(): Promise<void> {
  try {
    await endSession();
  } catch (error) {
    // The cookie is cleared either way, so the person is signed out of the browser even if the
    // row could not be deleted; a stranded row expires on its own.
    console.error("Sign-out failed:", error);
  }
}
