import "server-only";

/*
  Signing in with Google or Facebook, on top of the accounts that already exist.

  One authorization-code flow, described as data, with a provider entry per service. Adding a
  third is an entry in PROVIDERS and a button; nothing about the flow changes. Sessions, the
  users table and the DAL are untouched — a provider is another way to reach `startSession()`.

  What makes the flow safe, in the order it matters:

  - `state`: a random value put in a short-lived httpOnly cookie and echoed by the provider. If
    the value coming back does not match the cookie, the callback did not start here, and a
    request forged by another site cannot guess it. Nothing else in the callback is trusted until
    this passes.
  - PKCE: a random verifier stays in that cookie and only its SHA-256 goes to the provider, so a
    code intercepted in transit cannot be exchanged without the verifier. Enabled per provider.
  - The code is exchanged server-to-server over TLS with the client secret, and the profile is
    read from the provider's own endpoint with the resulting token. Nothing the browser sends is
    used as identity — only what the provider says directly to us.
  - Accounts are linked on a *verified* email and nothing else. An unverified address would let
    somebody register it at a provider and take over an existing Slim Wellness Asia account.
*/

export type ProviderId = "google" | "facebook";

export type Profile = {
  /** The provider's stable id for this person. Not an email; emails change. */
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
};

type Provider = {
  id: ProviderId;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  /** Facebook's token endpoint accepts PKCE inconsistently across versions; Google requires it. */
  pkce: boolean;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
  fetchProfile: (accessToken: string) => Promise<Profile>;
};

const PROVIDERS: Record<ProviderId, Provider> = {
  google: {
    id: "google",
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    pkce: true,
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    async fetchProfile(accessToken) {
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Google userinfo failed: ${response.status}`);
      const data = (await response.json()) as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        given_name?: string;
      };
      return {
        id: data.sub,
        email: data.email?.toLowerCase() ?? null,
        emailVerified: data.email_verified === true,
        displayName: data.name ?? data.given_name ?? null,
      };
    },
  },

  facebook: {
    id: "facebook",
    label: "Facebook",
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scope: "email public_profile",
    pkce: false,
    clientId: () => process.env.FACEBOOK_CLIENT_ID,
    clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
    async fetchProfile(accessToken) {
      const url = new URL("https://graph.facebook.com/v21.0/me");
      url.searchParams.set("fields", "id,name,email");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Facebook profile failed: ${response.status}`);
      const data = (await response.json()) as { id: string; name?: string; email?: string };
      return {
        id: data.id,
        email: data.email?.toLowerCase() ?? null,
        // Graph only returns an address once the person has confirmed it, and omits it entirely
        // otherwise — so an address arriving here is a confirmed one. Someone who signed up to
        // Facebook by phone number has no email, and gets a Slim Wellness Asia account
        // without one.
        emailVerified: Boolean(data.email),
        displayName: data.name ?? null,
      };
    },
  },
};

export function getProvider(id: string): Provider | null {
  return Object.hasOwn(PROVIDERS, id) ? PROVIDERS[id as ProviderId] : null;
}

/** Providers with both halves of their credentials set. Nothing else is offered in the UI. */
export function configuredProviders(): { id: ProviderId; label: string }[] {
  return Object.values(PROVIDERS)
    .filter((provider) => provider.clientId() && provider.clientSecret())
    .map(({ id, label }) => ({ id, label }));
}

export function isConfigured(provider: Provider): boolean {
  return Boolean(provider.clientId() && provider.clientSecret());
}

/**
 * The redirect URI, which has to match what is registered with the provider exactly. Derived from
 * the request so localhost and a deployed host both work without a second environment variable,
 * with OAUTH_REDIRECT_ORIGIN as an override for when the app sits behind a proxy that rewrites
 * the host.
 */
export function redirectUri(provider: ProviderId, requestUrl: string): string {
  const origin = process.env.OAUTH_REDIRECT_ORIGIN ?? new URL(requestUrl).origin;
  return `${origin}/api/auth/${provider}/callback`;
}

export function authorizeUrl(
  provider: Provider,
  options: { state: string; challenge: string | null; redirect: string },
): string {
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set("client_id", provider.clientId()!);
  url.searchParams.set("redirect_uri", options.redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", provider.scope);
  url.searchParams.set("state", options.state);
  if (provider.pkce && options.challenge) {
    url.searchParams.set("code_challenge", options.challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

/** Exchanges the code for an access token. Server to server, with the client secret. */
export async function exchangeCode(
  provider: Provider,
  options: { code: string; verifier: string | null; redirect: string },
): Promise<string> {
  const body = new URLSearchParams({
    client_id: provider.clientId()!,
    client_secret: provider.clientSecret()!,
    code: options.code,
    redirect_uri: options.redirect,
    grant_type: "authorization_code",
  });
  if (provider.pkce && options.verifier) body.set("code_verifier", options.verifier);

  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    // The body of a failed exchange can quote the code and the secret back at you, so it is
    // summarised rather than logged whole.
    throw new Error(`${provider.label} token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error(`${provider.label} returned no access token`);
  return data.access_token;
}
