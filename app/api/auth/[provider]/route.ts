import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authorizeUrl, getProvider, isConfigured, redirectUri } from "@/lib/oauth";

/*
  Starts a provider sign-in: GET /api/auth/google?next=/account

  Everything the callback will need to trust itself is written to one short-lived httpOnly cookie
  before we hand over — the `state` it must echo, the PKCE verifier it must never see, and where
  to land afterwards. Ten minutes is long enough to type a password at Google and short enough
  that a stale one is worthless.
*/

export const OAUTH_COOKIE = "swa.oauth";

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

/** Same rule as the sign-in form: only a local path, never "//host" or "/\host". */
function safeNext(value: string | null): string {
  return value && /^\/(?![/\\])/.test(value) ? value : "/account";
}

export async function GET(request: Request, context: RouteContext<"/api/auth/[provider]">) {
  const { provider: id } = await context.params;
  const provider = getProvider(id);

  if (!provider || !isConfigured(provider)) {
    // Either a provider we do not have, or one whose credentials are not set. Both look the same
    // from outside, and neither is worth an error page.
    return NextResponse.redirect(new URL("/signin?error=provider", request.url));
  }

  const state = base64url(randomBytes(32));
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const next = safeNext(new URL(request.url).searchParams.get("next"));

  const store = await cookies();
  store.set(OAUTH_COOKIE, JSON.stringify({ provider: provider.id, state, verifier, next }), {
    httpOnly: true,
    // Lax, not Strict: the provider sends the person back with a top-level GET, which Strict
    // would not attach the cookie to — and the callback would have nothing to check `state` against.
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(
    authorizeUrl(provider, {
      state,
      challenge: provider.pkce ? challenge : null,
      redirect: redirectUri(provider.id, request.url),
    }),
  );
}
