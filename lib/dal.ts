import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { isConfigured } from "@/lib/db";
import { readSession, type SessionUser } from "@/lib/session";

/*
  Data Access Layer — the one place that answers "who is asking?".

  Everything that touches per-user data goes through here rather than reading the cookie itself,
  so the check cannot be forgotten at a call site. `cache()` memoises it for the duration of a
  single render pass: a page, its layout and three components can all ask, and the database is
  queried once.

  What comes back is a two-field DTO, never the user row. No hash, no email, no lockout state
  can reach a component and from there the client bundle.
*/

export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isConfigured()) return null;

  try {
    return await readSession();
  } catch (error) {
    // Reading cookies during a prerender throws a framework control-flow error that means "this
    // route is dynamic, re-render it at request time". Swallowing it would make the page render
    // as though nobody were signed in; unstable_rethrow puts it back and keeps this catch for
    // real failures only.
    unstable_rethrow(error);
    // A database that is unreachable should not turn every page into an error page: the site is
    // a catalogue first, and the correct fallback is "nobody is signed in".
    console.error("Session lookup failed:", error);
    return null;
  }
});

/**
 * Same, but for pages and actions that have nothing to show a stranger. Sends them to sign in
 * and back again afterwards.
 */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(next ? `/signin?next=${encodeURIComponent(next)}` : "/signin");
  return user;
}
