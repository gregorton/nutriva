import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { linkOrCreateAccount } from "@/lib/accounts";
import { exchangeCode, getProvider, isConfigured, redirectUri } from "@/lib/oauth";
import { pruneExpiredSessions, startSession } from "@/lib/session";
import { OAUTH_COOKIE } from "@/app/api/auth/[provider]/route";

/*
  Where the provider sends people back: GET /api/auth/google/callback?code=…&state=…

  Read this top to bottom as a series of refusals. Nothing in the query string is treated as
  identity — the code is only a token to exchange, and who somebody is comes from the provider's
  own endpoint over TLS in `exchangeCode` and `fetchProfile`.
*/

type Stashed = { provider: string; state: string; verifier: string; next: string };

function fail(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/signin?error=${reason}`, request.url));
}

/** Constant-time, and length-safe: timingSafeEqual throws on a length mismatch. */
function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request, context: RouteContext<"/api/auth/[provider]/callback">) {
  const { provider: id } = await context.params;
  const provider = getProvider(id);
  const url = new URL(request.url);

  const store = await cookies();
  const stashed = store.get(OAUTH_COOKIE)?.value;
  // One attempt per cookie, whatever the outcome.
  store.delete(OAUTH_COOKIE);

  if (!provider || !isConfigured(provider)) return fail(request, "provider");

  // The person pressed cancel, or the provider refused. Not an error worth a stack trace.
  if (url.searchParams.get("error")) return fail(request, "cancelled");

  if (!stashed) return fail(request, "expired");

  let session: Stashed;
  try {
    session = JSON.parse(stashed) as Stashed;
  } catch {
    return fail(request, "expired");
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  // The check the whole flow rests on: if this does not match, the request did not start here.
  if (!state || !session.state || !sameToken(state, session.state)) return fail(request, "state");
  if (session.provider !== provider.id) return fail(request, "state");
  if (!code) return fail(request, "code");

  try {
    const accessToken = await exchangeCode(provider, {
      code,
      verifier: provider.pkce ? session.verifier : null,
      redirect: redirectUri(provider.id, request.url),
    });

    const profile = await provider.fetchProfile(accessToken);
    const result = await linkOrCreateAccount(provider.id, profile);

    if (!result.ok) {
      // The provider's address already belongs to an account, and it did not arrive verified, so
      // linking would be a takeover. Sending them to the password form is the safe answer.
      return fail(request, "email-taken");
    }

    await startSession(result.account.id, request.headers.get("user-agent"));
    await pruneExpiredSessions();
  } catch (error) {
    console.error(`${provider.label} sign-in failed:`, error);
    return fail(request, "provider");
  }

  // A full navigation, so the masthead is rendered fresh and SessionSync picks the session up on
  // arrival — there is no client state left over from before to disagree with it.
  return NextResponse.redirect(new URL(session.next, request.url));
}
