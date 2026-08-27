import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/dal";
import { AuthFlow } from "@/components/account/auth-flow";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to write reviews and keep a list of saved products.",
};

/** Same path sanitising as the action: anything that is not a local path is ignored. */
function localPath(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/(?![/\\])/.test(next) ? next : "/account";
}

/*
  Where a provider sign-in lands when it does not finish. The reasons are set by
  app/api/auth/[provider]/callback/route.ts, and each one says what to do next rather than what
  went wrong internally — "state mismatch" means nothing to the person reading it.
*/
const REASONS: Record<string, string> = {
  provider: "That sign-in option is not working right now. Your email and password still will.",
  cancelled: "That sign-in was cancelled. Nothing has changed.",
  expired: "That took too long to finish. Start again.",
  state: "That sign-in could not be verified. Please try it again.",
  code: "That sign-in came back incomplete. Please try it again.",
  "email-taken":
    "There is already an account with that email address. Sign in with your password below.",
};

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next, error, email } = await searchParams;
  const target = localPath(next);
  const reason = typeof error === "string" ? REASONS[error] : undefined;

  // Already signed in — there is nothing for this page to do.
  if (await getUser()) redirect(target);

  return <AuthFlow path="/signin" next={target} notice={reason} email={email} />;
}
