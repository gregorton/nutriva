import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { isConfigured, queryOne } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

/*
  Who is allowed to see /admin.

  The allowlist is an environment variable rather than a column on `users`. Revoking access is
  then an env edit rather than a migration, there is no admin flag in the database for a stray
  update to flip, and a shared link is not itself a credential — whoever opens /admin still
  signs in through the ordinary form first, and the link alone gets them nothing.

  lib/dal.ts is explicit that no email may reach a component, and that rule is not bent here:
  the address is looked up inside this module, compared, and only a boolean leaves.
*/

/** Comma-separated in the environment; trimmed, lowercased, empties dropped. */
function allowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether the gate is configured at all. With no allowlist there is no administrator, so the
 * surface 404s for everybody rather than standing open for whoever signs in first.
 */
export function adminGateConfigured(): boolean {
  return allowlist().length > 0;
}

/*
  `cache()` for the reason getUser() uses it: a layout and its page both ask, and this costs one
  statement per render pass rather than one per caller.
*/
export const isAdmin = cache(async (): Promise<boolean> => {
  if (!isConfigured() || !adminGateConfigured()) return false;

  const user = await getUser();
  if (!user) return false;

  const row = await queryOne<{ email: string | null }>("select email from users where id = $1", [
    user.id,
  ]);
  const email = row?.email?.trim().toLowerCase();
  if (!email) return false;

  return allowlist().includes(email);
});

/**
 * The gate every /admin route calls for itself — a layout does not control whether its children
 * render, the same reason /account repeats `requireUser()` on every page.
 *
 * A stranger is sent to sign in. Somebody signed in who is not on the list gets a 404 rather
 * than a 403, so a guessed URL says nothing about whether the surface exists.
 */
export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (!(await isAdmin())) notFound();
  return user;
}
