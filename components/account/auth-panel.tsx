import Link from "next/link";
import { AuthForm } from "@/components/account/auth-form";
import { OAuthButtons } from "@/components/account/oauth-buttons";

/*
  The one panel behind /signin and /signup. Both pages ask the same question — get me into an
  account — so they read as one card with one heading, and the mode only changes which fields the
  form shows and which way the footer link points.

  Cancel goes home rather than back: history could be the OAuth callback or a redirect from
  /account, and neither is somewhere to return a person who has changed their mind.
*/
export function AuthPanel({
  mode,
  next,
  notice,
}: {
  mode: "signin" | "signup";
  next: string;
  notice?: string;
}) {
  const isSignUp = mode === "signup";

  return (
    <div className="shell flex justify-center py-10 sm:py-14">
      <div className="w-full max-w-[460px] rounded-tile border border-line bg-paper p-6 sm:px-8 sm:py-7">
        <Link
          href="/"
          className="text-sm font-medium text-plum-700 hover:underline focus-visible:underline"
        >
          Cancel
        </Link>

        <div className="mt-5 text-center">
          <h1 className="text-[23px] leading-snug">Sign in or create an account</h1>
          <p className="mt-1.5 text-sm text-muted">
            Choose your preferred method below to get started.
          </p>
        </div>

        {notice && (
          <p
            role="alert"
            className="mt-5 rounded-card border border-turmeric-500/40 bg-turmeric-100 px-3.5 py-2.5 text-sm text-turmeric-700"
          >
            {notice}
          </p>
        )}

        <div className="mt-6">
          <AuthForm mode={mode} next={next} />
        </div>

        <OAuthButtons mode={mode} next={next} />

        <p className="mt-6 border-t border-line pt-4 text-center text-sm text-muted">
          {isSignUp ? "Already have an account? " : "No account yet? "}
          <Link
            href={`${isSignUp ? "/signin" : "/signup"}?next=${encodeURIComponent(next)}`}
            className="font-medium text-plum-700 hover:underline"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}
