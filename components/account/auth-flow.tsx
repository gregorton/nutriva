import Link from "next/link";
import { accountExists } from "@/lib/accounts";
import { isConfigured } from "@/lib/db";
import { normaliseEmail } from "@/lib/validate";
import { OAuthButtons } from "@/components/account/oauth-buttons";
import { CreateStep, PasswordStep } from "@/components/account/auth-steps";

/*
  Signing in, in two steps: an address, then whatever that address needs — a password if it has an
  account, a new one if it does not.

  **The step lives in the URL, not in state.** Continue is a GET form that lands on `?email=…`, and
  this component looks the address up on the server to decide which second screen to render. That
  buys three things a client-held step would not: the first step needs no JavaScript at all, Back
  and Change are ordinary links so the browser's own back button agrees with the one on the page,
  and reloading step two stays on step two. The cost is the address sitting in the URL, which is
  the person's own address in their own address bar, and `/signin` was already a dynamic route for
  reading the session cookie — so nothing is paid for the searchParams read.

  There is no card and no tinted panel: fields, buttons and one heading on the page's own white.
*/

export async function AuthFlow({
  path,
  next,
  notice,
  email,
}: {
  /** Which route this flow is mounted on — step one posts back to it. */
  path: "/signin" | "/signup";
  next: string;
  notice?: string;
  email?: string | string[];
}) {
  const address = normaliseEmail(email);

  // No address yet, or one that could not be an account: step one.
  if (!address) return <EmailScreen path={path} next={next} notice={notice} />;

  // With no database there is nothing to look the address up in. The rest of the site works
  // without one, so this says so rather than throwing.
  if (!isConfigured()) {
    return <EmailScreen path={path} next={next} notice={NO_DATABASE} value={address} />;
  }

  let exists: boolean;
  try {
    exists = await accountExists(address);
  } catch (error) {
    console.error("Account lookup failed:", error);
    return <EmailScreen path={path} next={next} notice={NO_DATABASE} value={address} />;
  }

  const changeHref = `${path}?next=${encodeURIComponent(next)}`;

  return (
    <Screen>
      <BackLink href={changeHref}>Back</BackLink>
      <Heading>{exists ? "Sign in" : "Create a new account"}</Heading>

      <div className="mt-6">
        <p className="text-[11.5px] text-muted">Email address:</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <span className="min-w-0 break-all text-[15px] font-semibold text-ink">{address}</span>
          <Link
            href={changeHref}
            className="shrink-0 text-sm font-medium text-plum-700 hover:underline"
          >
            Change
          </Link>
        </div>
      </div>

      {exists ? (
        <PasswordStep email={address} next={next} />
      ) : (
        <CreateStep email={address} next={next} />
      )}
    </Screen>
  );
}

const NO_DATABASE = "Accounts are unavailable right now. Everything else on the site still works.";

/** Step one: the address, and the providers that skip needing one. */
function EmailScreen({
  path,
  next,
  notice,
  value,
}: {
  path: string;
  next: string;
  notice?: string;
  value?: string;
}) {
  return (
    <Screen>
      <BackLink href="/">Cancel</BackLink>
      <Heading>Sign in or create an account</Heading>
      <p className="mt-1.5 text-center text-sm text-muted">
        Choose your preferred method below to get started.
      </p>

      {notice && <Notice>{notice}</Notice>}

      {/* A GET form, so Continue is a navigation: no client JavaScript, and the address ends up
          somewhere the back button understands. */}
      <form method="get" action={path} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="auth-email" className="sr-only">
          Email address
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={value}
          required
          placeholder="Email address"
          className="h-12 w-full rounded-card border border-line-strong bg-white px-3.5 text-[15px] text-ink placeholder:text-faint focus:border-plum-600 focus:outline-none"
        />
        <button
          type="submit"
          className="mt-3 h-12 w-full rounded-card bg-plum-800 text-[15px] font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Continue
        </button>
      </form>

      <OAuthButtons next={next} />
    </Screen>
  );
}

/* The three pieces of chrome every screen shares. Kept here rather than in a wrapper component so
   each screen still reads top to bottom. */

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[384px]">{children}</div>
    </div>
  );
}

function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-plum-700 hover:underline">
      {children}
    </Link>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-6 text-center text-[23px] leading-snug">{children}</h1>;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-5 rounded-card border border-turmeric-500/40 px-3.5 py-2.5 text-sm text-turmeric-700"
    >
      {children}
    </p>
  );
}
