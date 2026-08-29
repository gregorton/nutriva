import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/dal";
import { AuthFlow } from "@/components/account/auth-flow";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Slim Wellness Asia account to write reviews and save products.",
};

function localPath(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/(?![/\\])/.test(next) ? next : "/account";
}

/*
  The same flow as /signin, mounted on the path the rest of the site links to for creating an
  account. There is one screen to start from either way — an address, then whatever that address
  turns out to need — so this route differs from /signin only in where Continue posts back to.
*/
export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next, email } = await searchParams;
  const target = localPath(next);

  if (await getUser()) redirect(target);

  return <AuthFlow path="/signup" next={target} email={email} />;
}
