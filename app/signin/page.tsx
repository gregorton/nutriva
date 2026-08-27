import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/dal";
import { AuthForm } from "@/components/account/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to write reviews and keep a list of saved products.",
};

/** Same path sanitising as the action: anything that is not a local path is ignored. */
function localPath(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/(?![/\\])/.test(next) ? next : "/account";
}

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next } = await searchParams;
  const target = localPath(next);

  // Already signed in — there is nothing for this page to do.
  if (await getUser()) redirect(target);

  return (
    <div className="shell flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-[420px]">
        <h1 className="text-[26px] leading-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          An account is for writing reviews and saving products. Browsing and the cart work
          without one.
        </p>

        <div className="mt-6 rounded-tile border border-line bg-paper p-6">
          <AuthForm mode="signin" next={target} />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          No account yet?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(target)}`}
            className="font-medium text-plum-700 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
